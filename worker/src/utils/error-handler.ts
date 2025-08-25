import { CorsHeaders } from '../middleware/cors';

export interface ErrorResponse {
  error: string;
  message?: string;
  details?: any;
}

/**
 * Creates a standardized error response
 * @param error The error message
 * @param status The HTTP status code
 * @param corsHeaders The CORS headers to include
 * @param details Optional additional error details
 * @returns Error response
 */
export function createErrorResponse(
  error: string,
  status: number,
  corsHeaders: CorsHeaders,
  details?: any,
): Response {
  const errorResponse: ErrorResponse = {
    error,
  };

  if (details) {
    if (details instanceof Error) {
      errorResponse.message = details.message;
    } else {
      errorResponse.details = details;
    }
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