import { Env } from '../types';
import { CorsHeaders } from '../middleware/cors';

interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
  debug?: {
    environment: string;
    config: {
      r2_bucket: string;
      autorag_instance: string;
      ai_gateway: string;
      cors_mode: string;
      allowed_origins: string[] | string;
    };
  };
}

/**
 * Handles health check endpoint
 * @param env The environment configuration
 * @param corsHeaders The CORS headers to include
 * @returns Health check response
 */
export function handleHealth(env: Env, corsHeaders: CorsHeaders): Response {
  const debugMode = env.DEBUG_MODE === 'true';
  const allowedOrigins = env.ALLOWED_ORIGINS?.split(',').map((origin) => origin.trim());

  const healthResponse: HealthResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  };

  // Include debug info only if DEBUG_MODE is enabled
  // Helpful for framework users during setup
  if (debugMode) {
    healthResponse.debug = {
      environment: env.ENVIRONMENT || 'development',
      config: {
        r2_bucket: env.R2_BUCKET ? 'Configured' : 'Not configured',
        autorag_instance: env.AUTORAG_INSTANCE_ID ? 'Configured' : 'Not configured',
        ai_gateway: env.GATEWAY_NAME ? 'Configured' : 'Not configured',
        cors_mode: allowedOrigins ? 'Restricted' : 'Open (wildcard)',
        allowed_origins: allowedOrigins || ['*'],
      },
    };
  }

  return new Response(JSON.stringify(healthResponse), {
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}