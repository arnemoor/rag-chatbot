import { CorsHeaders } from '../middleware/cors';
import { Env } from '../types';

export interface ErrorResponse {
  error: string;
  message?: string;
  details?: any;
}

// Map of error messages that are safe to expose to clients
const SAFE_ERROR_MESSAGES: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  413: 'Request Entity Too Large',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout'
};

/**
 * Creates a standardized error response
 * SECURITY: Never expose internal error details in production
 * @param error The error message
 * @param status The HTTP status code
 * @param corsHeaders The CORS headers to include
 * @param details Optional additional error details
 * @param env Optional environment object for checking environment type
 * @returns Error response
 */
export function createErrorResponse(
  error: string,
  status: number,
  corsHeaders: CorsHeaders,
  details?: any,
  env?: Env,
): Response {
  const errorResponse: ErrorResponse = {
    error: SAFE_ERROR_MESSAGES[status] || 'Error',
  };

  // Only include details in development/staging environments
  // Check env object first (Workers), fall back to checking for development keywords
  const isDevelopment = env?.ENVIRONMENT === 'development' || 
                       env?.ENVIRONMENT === 'staging' ||
                       env?.DEBUG_MODE === 'true';
  
  if (isDevelopment && details) {
    if (details instanceof Error) {
      errorResponse.message = details.message;
    } else {
      errorResponse.details = details;
    }
  } else {
    // In production, only include safe user-facing messages
    if (status === 400 && details?.validation) {
      // Include validation errors as they're user-facing
      errorResponse.message = 'Validation failed';
      errorResponse.details = details.validation;
    } else if (status === 429) {
      // Include rate limit information
      errorResponse.message = error || 'Too many requests';
    } else {
      // Generic safe message
      errorResponse.message = SAFE_ERROR_MESSAGES[status] || 'An error occurred';
    }
  }
  
  // Log the actual error for monitoring (but don't expose it)
  if (!isDevelopment && details) {
    console.error(`Error ${status}:`, error, details);
  }

  return new Response(JSON.stringify(errorResponse), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

/**
 * Handles unknown routes with appropriate error response
 * @param method The request method
 * @param corsHeaders The CORS headers to include
 * @returns Error response for unknown routes
 */
export function handleUnknownRoute(method: string, corsHeaders: CorsHeaders): Response {
  // For any standard HTTP method, return method not allowed
  return new Response('Method not allowed', {
    status: 405,
    headers: corsHeaders,
  });
}