import { Env } from './types';

// Middleware imports
import { buildCorsHeaders, handleOptions } from './middleware/cors';
import { applySecurityChecks, buildSecurityHeaders } from './middleware/security';

// Route imports
import { handleHealth } from './routes/health';
import {
  handleR2List,
  handleR2Get,
  handleR2Upload,
  handleR2Delete,
  handleR2CreateFolder,
} from './routes/r2';
import {
  handleGetConfig,
  handleRefreshConfig,
  handleGetLanguages,
  handleGetCategories,
  handleGetProviders,
  handleGetModels,
  handleGetProducts,
  handleLegacyCategories,
} from './routes/config';
import { handleChat } from './routes/chat';

// Utility imports
import { handleUnknownRoute } from './utils/error-handler';

/**
 * Main worker entry point - acts as a thin routing layer
 * All business logic is delegated to specialized modules
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      // Apply security checks first (rate limiting, request size, etc.)
      const securityResponse = await applySecurityChecks(request, env);
      if (securityResponse) {
        return securityResponse;
      }

      // Build CORS headers for all responses
      const corsHeaders = buildCorsHeaders(request, env);
      
      // Build security headers
      const securityHeaders = buildSecurityHeaders(env);
      
      // Combine all headers
      const responseHeaders = {
        ...corsHeaders,
        ...securityHeaders
      };

      // Handle preflight requests
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: responseHeaders
        });
      }

      // Parse URL for routing
      const url = new URL(request.url);

      // Route to appropriate handler based on path and method
      
      // Health check endpoint
      if (url.pathname === '/health' && request.method === 'GET') {
        return handleHealth(env, responseHeaders);
      }

      // R2 Storage endpoints
      if (url.pathname === '/r2/list' && request.method === 'GET') {
        return handleR2List(url, env, responseHeaders);
      }

      if (url.pathname.startsWith('/r2/get/') && request.method === 'GET') {
        return handleR2Get(url.pathname, env, responseHeaders);
      }

      if (url.pathname === '/r2/upload' && request.method === 'POST') {
        return handleR2Upload(request, env, responseHeaders);
      }

      if (url.pathname.startsWith('/r2/delete/') && request.method === 'DELETE') {
        return handleR2Delete(url.pathname, env, responseHeaders);
      }

      if (url.pathname === '/r2/folder' && request.method === 'POST') {
        return handleR2CreateFolder(request, env, responseHeaders);
      }

      // Configuration endpoints
      if (url.pathname === '/config' && request.method === 'GET') {
        return handleGetConfig(env, responseHeaders);
      }

      if (url.pathname === '/config/refresh' && request.method === 'POST') {
        return handleRefreshConfig(env, responseHeaders);
      }

      if (url.pathname === '/config/languages' && request.method === 'GET') {
        return handleGetLanguages(env, responseHeaders);
      }

      if (url.pathname === '/config/categories' && request.method === 'GET') {
        return handleGetCategories(env, responseHeaders);
      }

      if (url.pathname === '/config/providers' && request.method === 'GET') {
        return handleGetProviders(env, responseHeaders);
      }

      if (url.pathname === '/config/models' && request.method === 'GET') {
        return handleGetModels(url, env, responseHeaders);
      }

      if (url.pathname === '/config/products' && request.method === 'GET') {
        return handleGetProducts(url, env, responseHeaders);
      }

      // Legacy endpoints for backward compatibility
      if (url.pathname === '/categories' && request.method === 'GET') {
        return handleLegacyCategories(env, responseHeaders);
      }

      // Main chat endpoint (handles all POST requests to root, /chat, or /api/chat)
      if (request.method === 'POST' && (url.pathname === '/' || url.pathname === '/chat' || url.pathname === '/api/chat')) {
        return handleChat(request, env, responseHeaders);
      }

      // Handle GET requests to chat endpoints with proper error
      if (request.method === 'GET' && (url.pathname === '/api/chat' || url.pathname === '/chat')) {
        return handleUnknownRoute(request.method, responseHeaders);
      }

      // Handle unknown routes
      return handleUnknownRoute(request.method, responseHeaders);
    } catch (error) {
      // Global error handler - never expose internal details
      console.error('Worker error:', error);
      return new Response(
        JSON.stringify({
          error: 'Internal server error',
          message: 'An unexpected error occurred'
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...buildCorsHeaders(request, env)
          }
        }
      );
    }
  },
};