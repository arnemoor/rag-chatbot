import { ChatRequest, Env } from './types';
import { getCategories } from './config';

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


// Helper function to get valid categories and products dynamically
async function getValidationData(env: Env) {
  // Check cache
  if (validationCache && Date.now() - validationCache.timestamp < CACHE_TTL) {
    return validationCache;
  }

  try {
    const categories = await getCategories(env);
    
    // No fallback - if no categories found, return empty
    if (!categories || categories.length === 0) {
      validationCache = {
        categories: [] as string[],
        productsByCategory: new Map<string, string[]>(),
        timestamp: Date.now(),
      };
      return validationCache;
    }
    
    const categoryIds = categories.map(c => c.id);
    const productsByCategory = new Map<string, string[]>();

    for (const category of categories) {
      if (category.products && category.products.length > 0) {
        productsByCategory.set(
          category.id,
          category.products.map(p => p.id)
        );
      }
      // No defaults added for categories without products
    }

    validationCache = {
      categories: categoryIds,
      productsByCategory,
      timestamp: Date.now(),
    };

    return validationCache;
  } catch (error) {
    console.error('Failed to load validation data:', error);
    // Return empty validation data on error
    return {
      categories: [] as string[],
      productsByCategory: new Map<string, string[]>(),
      timestamp: Date.now(),
    };
  }
}

const MAX_QUERY_LENGTH = 2000;
const MIN_QUERY_LENGTH = 1;
const MAX_SESSION_ID_LENGTH = 100;
const SESSION_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

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
    
    // Check if any categories are configured
    if (validationData.categories.length === 0) {
      errors.push({
        field: 'configuration',
        message: 'No categories configured. Please upload documents to R2 bucket or add _config/app-config.json',
      });
    } else if (request.category && !validationData.categories.includes(request.category)) {
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
    // No env available - can't validate categories/products
    // Just skip validation for these fields
  }

  // Validate provider (optional)
  if (request.provider && !VALID_PROVIDERS.includes(request.provider)) {
    errors.push({
      field: 'provider',
      message: `Provider must be one of: ${VALID_PROVIDERS.join(', ')}`,
    });
  }

  // Validate sessionId format (optional) - enhanced validation
  if (request.sessionId) {
    if (typeof request.sessionId !== 'string') {
      errors.push({
        field: 'sessionId',
        message: 'SessionId must be a string',
      });
    } else if (request.sessionId.length > MAX_SESSION_ID_LENGTH) {
      errors.push({
        field: 'sessionId',
        message: `SessionId is too long (max ${MAX_SESSION_ID_LENGTH} characters)`,
      });
    } else if (!SESSION_ID_PATTERN.test(request.sessionId)) {
      errors.push({
        field: 'sessionId',
        message: 'SessionId contains invalid characters. Only alphanumeric, underscore, and hyphen allowed.',
      });
    }
  }
  
  // Validate model format if provided
  if (request.model) {
    if (typeof request.model !== 'string') {
      errors.push({
        field: 'model',
        message: 'Model must be a string',
      });
    } else if (request.model.length > 100) {
      errors.push({
        field: 'model',
        message: 'Model name is too long',
      });
    }
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
