import { OpenAI } from 'openai';
import { Env, ChatRequest, ChatResponse, Citation } from '../types';
import { validateChatRequest, sanitizeInput, InputValidationError } from '../validation';
import { isModelAvailable, handleFutureModel } from '../models';
import { buildSystemPrompt, RESPONSE_TEMPLATES } from '../prompts';
import { getCategories } from '../config';
import { CorsHeaders } from '../middleware/cors';
import { createErrorResponse } from '../utils/error-handler';
import { retryWithBackoff, CircuitBreaker, RetryPresets } from '../utils/retry';

// Circuit breakers for different services
const autoragBreaker = new CircuitBreaker(5, 60000, 3); // 5 failures, 1 minute timeout, 3 successes to close
const openaiBreaker = new CircuitBreaker(3, 30000, 2);  // 3 failures, 30 second timeout
const anthropicBreaker = new CircuitBreaker(3, 30000, 2); // 3 failures, 30 second timeout

/**
 * Builds dynamic category filters for AutoRAG search
 * @param env The environment configuration
 * @param category The category to filter by
 * @param product The product to filter by
 * @param language The language to filter by
 * @returns Filter object for AutoRAG
 */
async function buildCategoryFilter(env: Env, category: string, product: string, language: string) {
  // Category is required - no defaults
  if (!category) {
    throw new Error('Category is required. Available categories can be found at /config/categories');
  }
  
  // If product not specified, search all products in the category
  if (!product) {
    try {
      const categories = await getCategories(env);
      const cat = categories.find(c => c.id === category);
      
      if (!cat) {
        throw new Error(`Category not found: ${category}. Available categories can be found at /config/categories`);
      }
      
      if (!cat.products || cat.products.length === 0) {
        throw new Error(`No products found for category: ${category}. Please upload documents to ${category}/<product>/${language}/`);
      }
      
      const filters = cat.products
        .filter(p => p.available)
        .map(p => ({
          type: 'eq' as const,
          key: 'folder',
          value: `${category}/${p.id}/${language}/`,
        }));
      
      if (filters.length === 0) {
        throw new Error(`No available products in category: ${category}`);
      }
      
      return filters.length > 1 
        ? { type: 'or' as const, filters }
        : filters[0];
    } catch (error) {
      console.error('Failed to build category filter:', error);
      throw error;
    }
  }
  
  // Specific product requested - use exact path
  return {
    type: 'eq' as const,
    key: 'folder',
    value: `${category}/${product}/${language}/`,
  };
}

/**
 * Generates response using external model (OpenAI or Anthropic)
 * @param env The environment configuration
 * @param provider The AI provider to use
 * @param model The model to use
 * @param systemPrompt The system prompt
 * @param chunks The retrieved context chunks
 * @param query The user query
 * @param language The response language
 * @returns Generated response text
 */
async function generateWithExternalModel(
  env: Env,
  provider: string,
  model: string,
  systemPrompt: string,
  chunks: string,
  query: string,
  language: string,
): Promise<string> {
  if (provider === 'openai' && env.OPENAI_API_KEY) {
    // Use AI Gateway for monitoring and caching
    const gateway = env.AI.gateway(env.GATEWAY_NAME);
    const baseURL = await gateway.getUrl('openai');

    // Add language instruction to the query for better enforcement
    const languageInstruction =
      language === 'en'
        ? 'Answer in English: '
        : language === 'de'
          ? 'Antworte auf Deutsch: '
          : language === 'fr'
            ? 'Répondez en français: '
            : language === 'it'
              ? 'Rispondi in italiano: '
              : '';

    // GPT-5 uses the new Responses API, not Chat Completions
    if (model && model.startsWith('gpt-5')) {
      // GPT-5 uses a completely different API structure
      const combinedInput = `${systemPrompt}

Context from documents:
${chunks}

${languageInstruction}${query}`;

      // Use the Responses API for GPT-5
      const response = await openaiBreaker.execute(() =>
        retryWithBackoff(
          () => fetch(`${baseURL}/v1/responses`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model,
              input: combinedInput,
          reasoning: {
            effort: 'low', // Use low for faster responses in RAG
          },
          text: {
            verbosity: 'medium', // Medium verbosity for balanced responses
          },
            }),
          }),
          RetryPresets.rateLimited
        )
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`GPT-5 API error: ${error}`);
      }

      const data = (await response.json()) as any;

      // GPT-5 Responses API returns an object with an output array
      if (data.output && Array.isArray(data.output)) {
        const messageItem = data.output.find((item: any) => item.type === 'message');

        if (messageItem?.content && Array.isArray(messageItem.content)) {
          // Find the output_text item in content array
          const outputItem = messageItem.content.find((c: any) => c.type === 'output_text');
          if (outputItem?.text) {
            return outputItem.text;
          }
          // Fallback to first item with text
          if (messageItem.content[0]?.text) {
            return messageItem.content[0].text;
          }
        }
      }

      // Fallback: check if response is already an array (different API version)
      if (Array.isArray(data)) {
        const messageItem = data.find((item: any) => item.type === 'message');
        if (messageItem?.content && Array.isArray(messageItem.content)) {
          const outputItem = messageItem.content.find((c: any) => c.type === 'output_text');
          if (outputItem?.text) {
            return outputItem.text;
          }
          if (messageItem.content[0]?.text) {
            return messageItem.content[0].text;
          }
        }
      }

      // If data is an object with output_text or other text property
      if (typeof data === 'object' && data && !Array.isArray(data)) {
        if (data.output_text) return data.output_text;
        if (data.text) return data.text;
      }

      // Last resort - return error message if we couldn't parse
      return 'Error: Unable to parse GPT-5 response format';
    }
    // GPT-4 and earlier models use Chat Completions API
    const client = new OpenAI({
      apiKey: env.OPENAI_API_KEY || '',
      baseURL,
    });

    const completion = await client.chat.completions.create({
      model: model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Context:\n${chunks}\n\n${languageInstruction}${query}` },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || 'No response generated';
  }

  // Anthropic Claude support
  if (provider === 'anthropic' && env.ANTHROPIC_API_KEY) {
    // Use AI Gateway for monitoring and caching
    const gateway = env.AI.gateway(env.GATEWAY_NAME);
    const baseURL = await gateway.getUrl('anthropic');

    // Add language instruction
    const languageInstruction =
      language === 'en'
        ? 'Answer in English: '
        : language === 'de'
          ? 'Antworte auf Deutsch: '
          : language === 'fr'
            ? 'Répondez en français: '
            : language === 'it'
              ? 'Rispondi in italiano: '
              : '';

    // Note: Anthropic API requires different client setup
    // This is a placeholder for the actual implementation
    const response = await anthropicBreaker.execute(() =>
      retryWithBackoff(
        () => fetch(`${baseURL}/v1/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': env.ANTHROPIC_API_KEY || '',
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: model || 'claude-sonnet-4-20250514',
        messages: [
          {
            role: 'user',
            content: `${systemPrompt}\n\nContext:\n${chunks}\n\n${languageInstruction}${query}`,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
          }),
        }),
        RetryPresets.rateLimited
      )
    );

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = (await response.json()) as any;
    return data.content?.[0]?.text || 'No response generated';
  }

  throw new Error(`Unsupported provider: ${provider}`);
}

/**
 * Extracts citations from AutoRAG response
 * @param response The AutoRAG response
 * @returns Array of citations
 */
function extractCitationsFromAutoRAG(response: any): Citation[] {
  // Extract from the data array as per API documentation
  const data = response.data || [];

  if (!Array.isArray(data)) return [];

  return data.map((item: any) => ({
    filename: item.filename || item.attributes?.filename || 'Unknown source',
    relevance: item.score || 0,
    snippet: item.content?.[0]?.text ? `${item.content[0].text.substring(0, 100)}...` : '',
  }));
}

/**
 * Extracts citations from search result
 * @param searchResult The search result
 * @returns Array of citations
 */
function extractCitationsFromSearch(searchResult: any): Citation[] {
  // Extract from the data array as per Search API documentation
  const data = searchResult.data || [];

  if (!Array.isArray(data)) return [];

  return data.map((item: any) => ({
    filename: item.filename || item.attributes?.filename || 'Unknown source',
    relevance: item.score || 0,
    snippet: item.content?.[0]?.text ? `${item.content[0].text.substring(0, 100)}...` : '',
  }));
}

/**
 * Handles the main chat endpoint
 * @param request The incoming request
 * @param env The environment configuration
 * @param corsHeaders The CORS headers to include
 * @returns Chat response
 */
export async function handleChat(
  request: Request,
  env: Env,
  corsHeaders: CorsHeaders,
): Promise<Response> {
  try {
    const startTime = Date.now();
    
    // Parse request body with error handling
    let chatRequest: ChatRequest;
    try {
      chatRequest = await request.json();
    } catch (error) {
      return createErrorResponse(
        'Invalid JSON in request body',
        400,
        corsHeaders,
        { validation: [{ field: 'body', message: 'Request body must be valid JSON' }] }
      );
    }

    // Validate request
    const validation = await validateChatRequest(chatRequest, env);
    if (!validation.isValid) {
      return createErrorResponse(
        'Validation failed',
        400,
        corsHeaders,
        { validation: validation.errors }
      );
    }

    // Sanitize query input with error handling
    try {
      chatRequest.query = sanitizeInput(chatRequest.query);
    } catch (error) {
      if (error instanceof InputValidationError) {
        return createErrorResponse(
          'Invalid input',
          400,
          corsHeaders,
          { validation: [{ field: 'query', message: error.message }] }
        );
      }
      throw error;
    }

    // Set defaults for language, provider and model only
    const language = chatRequest.language || 'en';
    const provider = chatRequest.provider || 'workers-ai';
    const model = chatRequest.model || '@cf/meta/llama-3.2-3b-instruct';
    
    // Category and product must come from request or config - no hardcoded defaults
    const category = chatRequest.category || '';
    const product = chatRequest.product || '';
    
    // Check if category is provided
    if (!category) {
      const categories = await getCategories(env);
      const availableCategories = categories.map(c => c.id).join(', ');
      
      return new Response(
        JSON.stringify({
          error: 'Category required',
          message: availableCategories 
            ? `Please specify a category. Available: ${availableCategories}`
            : 'No categories configured. Please upload documents to R2 bucket.',
          availableCategories: categories.map(c => ({ id: c.id, name: c.name })),
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        },
      );
    }

    // Check if model is available (handle future models)
    if (!isModelAvailable(model)) {
      const futureModelMessage = handleFutureModel(model);
      return new Response(
        JSON.stringify({
          error: 'Model not available',
          message:
            futureModelMessage ||
            `Model ${model} is not yet available. Please select a different model.`,
          availableModels: [
            'gpt-4o',
            'gpt-4o-mini',
            'claude-3-5-sonnet-20241022',
            '@cf/meta/llama-3.1-8b-instruct-fast',
          ],
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        },
      );
    }

    // Generate or use existing session ID
    const sessionId = chatRequest.sessionId || crypto.randomUUID();

    // Build system prompt
    const systemPrompt = buildSystemPrompt({ language, category, product });

    // Create filter to search in the correct folder structure: {category}/{product}/{language}/
    let filter;
    try {
      filter = await buildCategoryFilter(env, category, product, language);
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: 'Configuration error',
          message: error instanceof Error ? error.message : 'Failed to build category filter',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        },
      );
    }

    let responseText: string;
    let citations: Citation[] = [];

    if (provider === 'workers-ai') {
      // Use AutoRAG with Workers AI (all-in-one RAG pipeline)
      try {
        // AutoRAG call - prepend language instruction to query for better enforcement
        const languageInstruction =
          language === 'en'
            ? 'Answer in English: '
            : language === 'de'
              ? 'Antworte auf Deutsch: '
              : language === 'fr'
                ? 'Répondez en français: '
                : language === 'it'
                  ? 'Rispondi in italiano: '
                  : '';

        const response = await autoragBreaker.execute(() =>
          retryWithBackoff(
            () => env.AI.autorag(env.AUTORAG_INSTANCE).aiSearch({
              query: languageInstruction + chatRequest.query,
              // model: model, // Optional - can specify model if needed
              system_prompt: systemPrompt, // Note: system_prompt, not generation_system_prompt
              filters: filter, // Enable filters to search only in the selected language folder
              max_num_results: 5, // Limit results for better performance
              rewrite_query: false, // Disable query rewriting for now
              stream: false, // Disable streaming
            }),
            {
              ...RetryPresets.standard,
              retryableErrors: (error) => {
                const message = error?.message?.toLowerCase() || '';
                return message.includes('service unavailable') ||
                       message.includes('timeout') ||
                       error?.status === 503 ||
                       error?.status === 429;
              },
            }
          )
        );

        console.log('AutoRAG response:', JSON.stringify(response));
        // Extract response text from the correct property
        responseText =
          response.response || response.text || RESPONSE_TEMPLATES.no_information[language];

        // Extract citations from the data array
        citations = response.data ? extractCitationsFromAutoRAG(response) : [];
      } catch (error) {
        console.error('AutoRAG error:', error);
        // Return more detailed error in development
        if (env.ENVIRONMENT === 'development') {
          responseText = `AutoRAG Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        } else {
          responseText = RESPONSE_TEMPLATES.error_occurred[language];
        }
      }
    } else {
      // External model path: retrieve with AutoRAG, generate with external LLM
      try {
        // Step 1: Retrieve relevant chunks using the Search API
        const searchResult = await autoragBreaker.execute(() =>
          retryWithBackoff(
            () => env.AI.autorag(env.AUTORAG_INSTANCE).search({
              query: chatRequest.query,
              filters: filter, // Use the same filter to search only in selected language
              max_num_results: 5, // Limit to 5 most relevant results
              rewrite_query: false, // Disable query rewriting for now
              ranking_options: {
                score_threshold: 0.4, // Minimum relevance score
              },
            }),
            RetryPresets.standard
          )
        );

        console.log('Search result:', JSON.stringify(searchResult));

        // Extract and concatenate chunks from the correct structure
        const chunks = searchResult.data
          ?.flatMap((item: any) => item.content?.map((c: any) => c.text) || [])
          .filter(Boolean)
          .join('\n\n');

        if (!chunks || chunks.length === 0) {
          responseText = RESPONSE_TEMPLATES.no_information[language];
        } else {
          // Step 2: Generate response with external model
          responseText = await generateWithExternalModel(
            env,
            provider,
            model,
            systemPrompt,
            chunks,
            chatRequest.query,
            language,
          );
        }

        citations = extractCitationsFromSearch(searchResult);
      } catch (error) {
        console.error('External model error:', error);
        // Return more detailed error in development
        if (env.ENVIRONMENT === 'development') {
          responseText = `External Model Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        } else {
          responseText = RESPONSE_TEMPLATES.error_occurred[language];
        }
      }
    }

    const response: ChatResponse = {
      text: responseText,
      citations,
      sessionId,
      metadata: {
        provider,
        model,
        responseTime: Date.now() - startTime,
        language,
      },
    };

    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('Request processing error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      },
    );
  }
}