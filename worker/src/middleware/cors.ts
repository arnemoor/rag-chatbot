import { Env } from '../types';

export interface CorsHeaders {
  [key: string]: string;
}

/**
 * Builds CORS headers based on environment configuration
 * 
 * FRAMEWORK NOTE: This is an open-source framework designed for evaluation and showcase.
 * By default, CORS is permissive to support various deployment scenarios.
 * For production deployments, set ALLOWED_ORIGINS environment variable to restrict access.
 * 
 * @param request The incoming request
 * @param env The environment configuration
 * @returns CORS headers object
 */
export function buildCorsHeaders(request: Request, env: Env): CorsHeaders {
  const requestOrigin = request.headers.get('Origin');
  const corsHeaders: CorsHeaders = {
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE, PUT', // DELETE and PUT for R2 browser and future extensions
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
    'Access-Control-Max-Age': '86400',
  };

  // Check if CORS should be restrictive (opt-in security)
  if (env.ALLOWED_ORIGINS) {
    // User has explicitly configured allowed origins - use strict validation
    const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
    
    if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
      corsHeaders['Access-Control-Allow-Origin'] = requestOrigin;
      corsHeaders['Access-Control-Allow-Credentials'] = 'true';
      corsHeaders['Vary'] = 'Origin';
    } else if (requestOrigin) {
      // Log unauthorized origin attempts when restrictions are enabled
      console.warn(`CORS restriction active: Blocked request from origin: ${requestOrigin}`);
      // Don't set any CORS origin header - this will block the request
    }
  } else {
    // Default permissive mode for framework/showcase
    // This allows easy evaluation and testing across different domains
    corsHeaders['Access-Control-Allow-Origin'] = requestOrigin || '*';
    
    // Important: Cannot set credentials with wildcard origin per CORS spec
    // Only set credentials when echoing back a specific origin
    if (requestOrigin) {
      corsHeaders['Access-Control-Allow-Credentials'] = 'true';
    }
    
    // Log once per worker instance to inform about security options
    if (!env.CORS_WARNING_LOGGED) {
      console.info('CORS: Running in permissive mode (framework default). Set ALLOWED_ORIGINS to restrict access.');
      env.CORS_WARNING_LOGGED = 'true';
    }
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