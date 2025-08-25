import { ChatRequest, Env } from './types';
import { getCategories, getProducts } from './config';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

const VALID_LANGUAGES = ['en', 'de', 'fr', 'it'];
const VALID_PROVIDERS = ['workers-ai', 'openai', 'anthropic'];

// Cache for validation data
let validationCache: {
  categories: string[];
  productsByCategory: Map<string, string[]>;
  timestamp: number;
} | null = null;

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Helper to get default products for a category
function getDefaultProductsForCategory(categoryId: string): string[] {
  switch (categoryId) {
    case 'fiction':
      return ['novels', 'short-stories'];
    case 'non-fiction':
      return ['self-help', 'biography'];
    case 'science':
      return ['research', 'physics'];
    case 'technology':
      return ['programming', 'ai-ml'];
    case 'reference':
      return ['catalog', 'encyclopedias'];
    default:
      return ['default'];
  }
}

// Fallback validation data
function getFallbackValidationData() {
  return {
    categories: ['fiction', 'non-fiction', 'science', 'technology', 'reference', 'general'],
    productsByCategory: new Map([
      ['fiction', ['novels', 'short-stories']],
      ['non-fiction', ['self-help', 'biography']],
      ['science', ['research', 'physics']],
      ['technology', ['programming', 'ai-ml']],
      ['reference', ['catalog', 'encyclopedias']],
    ]),
    timestamp: Date.now(),
  };
}

// Helper function to get valid categories and products dynamically
async function getValidationData(env: Env) {
  // Check cache
  if (validationCache && Date.now() - validationCache.timestamp < CACHE_TTL) {
    return validationCache;
  }

  try {
    const categories = await getCategories(env);
    
    // If no categories or only defaults, use fallback
    if (!categories || categories.length === 0) {
      return getFallbackValidationData();
    }
    
    const categoryIds = categories.map(c => c.id);
    const productsByCategory = new Map<string, string[]>();

    for (const category of categories) {
      if (category.products && category.products.length > 0) {
        productsByCategory.set(
          category.id,
          category.products.map(p => p.id)
        );
      } else if (category.id !== 'general') {
        // For categories without products discovered, use defaults
        const defaultProducts = getDefaultProductsForCategory(category.id);
        if (defaultProducts.length > 0) {
          productsByCategory.set(category.id, defaultProducts);
        }
      }
    }

    validationCache = {
      categories: categoryIds,
      productsByCategory,
      timestamp: Date.now(),
    };

    return validationCache;
  } catch (error) {
    console.error('Failed to load validation data:', error);
    return getFallbackValidationData();
  }
}

const MAX_QUERY_LENGTH = 2000;
const MIN_QUERY_LENGTH = 1;

export async function validateChatRequest(request: ChatRequest, env?: Env): Promise<ValidationResult> {
  const errors: ValidationError[] = [];

  // Validate query
  if (!request.query) {
    errors.push({
      field: 'query',
      message: 'Query is required',
    });
  } else if (typeof request.query !== 'string') {
    errors.push({
      field: 'query',
      message: 'Query must be a string',
    });
  } else {
    const queryLength = request.query.trim().length;
    if (queryLength < MIN_QUERY_LENGTH) {
      errors.push({
        field: 'query',
        message: `Query must be at least ${MIN_QUERY_LENGTH} character`,
      });
    } else if (queryLength > MAX_QUERY_LENGTH) {
      errors.push({
        field: 'query',
        message: `Query must not exceed ${MAX_QUERY_LENGTH} characters`,
      });
    }
  }

  // Validate language (optional)
  if (request.language && !VALID_LANGUAGES.includes(request.language)) {
    errors.push({
      field: 'language',
      message: `Language must be one of: ${VALID_LANGUAGES.join(', ')}`,
    });
  }

  // Validate category and product (optional) - now dynamic
  if (env && (request.category || request.product)) {
    const validationData = await getValidationData(env);
    
    // Validate category
    if (request.category && !validationData.categories.includes(request.category)) {
      errors.push({
        field: 'category',
        message: `Category must be one of: ${validationData.categories.join(', ')}`,
      });
    }
    
    // Validate product (must belong to the specified category)
    if (request.product && request.category && request.category !== 'general') {
      const validProducts = validationData.productsByCategory.get(request.category);
      if (validProducts && !validProducts.includes(request.product)) {
        errors.push({
          field: 'product',
          message: `Product must be one of: ${validProducts.join(', ')} for category ${request.category}`,
        });
      }
    }
  } else if (!env) {
    // Fallback validation without env (basic checks only)
    const fallbackCategories = ['fiction', 'non-fiction', 'science', 'technology', 'reference', 'general'];
    if (request.category && !fallbackCategories.includes(request.category)) {
      errors.push({
        field: 'category',
        message: `Category must be one of: ${fallbackCategories.join(', ')}`,
      });
    }
  }

  // Validate provider (optional)
  if (request.provider && !VALID_PROVIDERS.includes(request.provider)) {
    errors.push({
      field: 'provider',
      message: `Provider must be one of: ${VALID_PROVIDERS.join(', ')}`,
    });
  }

  // Validate sessionId format (optional)
  if (request.sessionId && typeof request.sessionId !== 'string') {
    errors.push({
      field: 'sessionId',
      message: 'SessionId must be a string',
    });
  } else if (request.sessionId && request.sessionId.length > 100) {
    errors.push({
      field: 'sessionId',
      message: 'SessionId is too long (max 100 characters)',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Custom error class for validation failures
 */
export class InputValidationError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
    this.name = 'InputValidationError';
  }
}

/**
 * Sanitizes user input for safe processing
 * Only removes control characters that could cause processing issues
 * Allows all content including SQL/HTML as users may legitimately ask about these topics
 * @param text - The raw input text
 * @returns Sanitized text safe for processing
 */
export function sanitizeInput(text: string): string {
  if (!text || typeof text !== 'string') {
    throw new InputValidationError('Invalid input type', 'INVALID_TYPE');
  }

  // Remove only control characters that could cause processing issues
  // Preserve newlines (\n) and tabs (\t) as they're legitimate in chat messages
  // Allow all other content including code snippets, SQL, HTML, etc.
  const sanitized = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();

  if (sanitized.length === 0) {
    throw new InputValidationError('Input cannot be empty', 'EMPTY_INPUT');
  }

  if (sanitized.length > MAX_QUERY_LENGTH) {
    throw new InputValidationError(
      `Input exceeds maximum length of ${MAX_QUERY_LENGTH} characters`,
      'TOO_LONG',
    );
  }

  return sanitized;
}
