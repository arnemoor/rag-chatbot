import { Env } from '../types';

export interface CorsHeaders {
  [key: string]: string;
}

/**
 * Builds CORS headers based on environment configuration
 * @param request The incoming request
 * @param env The environment configuration
 * @returns CORS headers object
 */
export function buildCorsHeaders(request: Request, env: Env): CorsHeaders {
  const allowedOrigins = env.ALLOWED_ORIGINS?.split(',').map((origin) => origin.trim());
  const requestOrigin = request.headers.get('Origin');

  const corsHeaders: CorsHeaders = {
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE, PUT',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };

  // Set CORS origin based on configuration
  if (allowedOrigins && requestOrigin) {
    if (allowedOrigins.includes(requestOrigin)) {
      corsHeaders['Access-Control-Allow-Origin'] = requestOrigin;
      corsHeaders['Access-Control-Allow-Credentials'] = 'true';
    } else {
      // If origin not in whitelist, don't set CORS headers (request will be blocked)
      console.warn(`Origin ${requestOrigin} not in allowed origins list`);
    }
  } else {
    // Default to wildcard for framework flexibility (development/testing)
    corsHeaders['Access-Control-Allow-Origin'] = '*';
  }

  return corsHeaders;
}

/**
 * Handles preflight OPTIONS requests
 * @param corsHeaders The CORS headers to include
 * @returns Response for OPTIONS request
 */
export function handleOptions(corsHeaders: CorsHeaders): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}