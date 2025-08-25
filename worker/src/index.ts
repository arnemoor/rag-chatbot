import { Env } from './types';

// Middleware imports
import { buildCorsHeaders, handleOptions } from './middleware/cors';

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
    // Build CORS headers for all responses
    const corsHeaders = buildCorsHeaders(request, env);

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return handleOptions(corsHeaders);
    }

    // Parse URL for routing
    const url = new URL(request.url);

    // Route to appropriate handler based on path and method
    
    // Health check endpoint
    if (url.pathname === '/health' && request.method === 'GET') {
      return handleHealth(env, corsHeaders);
    }

    // R2 Storage endpoints
    if (url.pathname === '/r2/list' && request.method === 'GET') {
      return handleR2List(url, env, corsHeaders);
    }

    if (url.pathname.startsWith('/r2/get/') && request.method === 'GET') {
      return handleR2Get(url.pathname, env, corsHeaders);
    }

    if (url.pathname === '/r2/upload' && request.method === 'POST') {
      return handleR2Upload(request, env, corsHeaders);
    }

    if (url.pathname.startsWith('/r2/delete/') && request.method === 'DELETE') {
      return handleR2Delete(url.pathname, env, corsHeaders);
    }

    if (url.pathname === '/r2/folder' && request.method === 'POST') {
      return handleR2CreateFolder(request, env, corsHeaders);
    }

    // Configuration endpoints
    if (url.pathname === '/config' && request.method === 'GET') {
      return handleGetConfig(env, corsHeaders);
    }

    if (url.pathname === '/config/refresh' && request.method === 'POST') {
      return handleRefreshConfig(env, corsHeaders);
    }

    if (url.pathname === '/config/languages' && request.method === 'GET') {
      return handleGetLanguages(env, corsHeaders);
    }

    if (url.pathname === '/config/categories' && request.method === 'GET') {
      return handleGetCategories(env, corsHeaders);
    }

    if (url.pathname === '/config/providers' && request.method === 'GET') {
      return handleGetProviders(env, corsHeaders);
    }

    if (url.pathname === '/config/models' && request.method === 'GET') {
      return handleGetModels(url, env, corsHeaders);
    }

    if (url.pathname === '/config/products' && request.method === 'GET') {
      return handleGetProducts(url, env, corsHeaders);
    }

    // Legacy endpoints for backward compatibility
    if (url.pathname === '/categories' && request.method === 'GET') {
      return handleLegacyCategories(env, corsHeaders);
    }

    // Main chat endpoint (handles all POST requests to root, /chat, or /api/chat)
    if (request.method === 'POST' && (url.pathname === '/' || url.pathname === '/chat' || url.pathname === '/api/chat')) {
      return handleChat(request, env, corsHeaders);
    }

    // Handle GET requests to chat endpoints with proper error
    if (request.method === 'GET' && (url.pathname === '/api/chat' || url.pathname === '/chat')) {
      return handleUnknownRoute(request.method, corsHeaders);
    }

    // Handle unknown routes
    return handleUnknownRoute(request.method, corsHeaders);
  },
};