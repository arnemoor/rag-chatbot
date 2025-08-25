import {
  loadConfiguration,
  getLanguages,
  getCategories,
  getProviders,
  getModels,
  getProducts,
  clearConfigCache,
} from '../config';
import { Env } from '../types';
import { CorsHeaders } from '../middleware/cors';

/**
 * Handles master configuration endpoint
 * @param env The environment configuration
 * @param corsHeaders The CORS headers to include
 * @returns Response with full configuration
 */
export async function handleGetConfig(env: Env, corsHeaders: CorsHeaders): Promise<Response> {
  try {
    const config = await loadConfiguration(env);
    return new Response(JSON.stringify(config), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('Error loading configuration:', error);
    return new Response(JSON.stringify({ error: 'Failed to load configuration' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

/**
 * Handles configuration cache refresh
 * @param env The environment configuration
 * @param corsHeaders The CORS headers to include
 * @returns Response with refreshed configuration
 */
export async function handleRefreshConfig(env: Env, corsHeaders: CorsHeaders): Promise<Response> {
  try {
    clearConfigCache();
    const config = await loadConfiguration(env);
    return new Response(
      JSON.stringify({
        message: 'Configuration refreshed successfully',
        config,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      },
    );
  } catch (error) {
    console.error('Error refreshing configuration:', error);
    return new Response(JSON.stringify({ error: 'Failed to refresh configuration' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

/**
 * Handles languages endpoint
 * @param env The environment configuration
 * @param corsHeaders The CORS headers to include
 * @returns Response with available languages
 */
export async function handleGetLanguages(env: Env, corsHeaders: CorsHeaders): Promise<Response> {
  try {
    const languages = await getLanguages(env);
    return new Response(JSON.stringify(languages), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('Error fetching languages:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch languages' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

/**
 * Handles categories endpoint
 * @param env The environment configuration
 * @param corsHeaders The CORS headers to include
 * @returns Response with available categories
 */
export async function handleGetCategories(env: Env, corsHeaders: CorsHeaders): Promise<Response> {
  try {
    const categories = await getCategories(env);
    return new Response(JSON.stringify(categories), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch categories' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

/**
 * Handles providers endpoint
 * @param env The environment configuration
 * @param corsHeaders The CORS headers to include
 * @returns Response with available providers
 */
export async function handleGetProviders(env: Env, corsHeaders: CorsHeaders): Promise<Response> {
  try {
    const providers = await getProviders(env);
    return new Response(JSON.stringify(providers), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('Error fetching providers:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch providers' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

/**
 * Handles models endpoint
 * @param url The URL object containing query parameters
 * @param env The environment configuration
 * @param corsHeaders The CORS headers to include
 * @returns Response with available models
 */
export async function handleGetModels(
  url: URL,
  env: Env,
  corsHeaders: CorsHeaders,
): Promise<Response> {
  try {
    const providerId = url.searchParams.get('provider') || undefined;
    const models = await getModels(env, providerId);
    return new Response(JSON.stringify(models), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch models' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

/**
 * Handles products endpoint
 * @param url The URL object containing query parameters
 * @param env The environment configuration
 * @param corsHeaders The CORS headers to include
 * @returns Response with available products
 */
export async function handleGetProducts(
  url: URL,
  env: Env,
  corsHeaders: CorsHeaders,
): Promise<Response> {
  try {
    const categoryId = url.searchParams.get('category');
    if (!categoryId) {
      return new Response(JSON.stringify({ error: 'Category parameter required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    const products = await getProducts(env, categoryId);
    return new Response(JSON.stringify(products), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch products' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

/**
 * Handles legacy categories endpoint for backward compatibility
 * @param env The environment configuration
 * @param corsHeaders The CORS headers to include
 * @returns Response with categories in legacy format
 */
export async function handleLegacyCategories(
  env: Env,
  corsHeaders: CorsHeaders,
): Promise<Response> {
  try {
    const categories = await getCategories(env);
    // Transform to legacy format
    const categoriesList = categories.map((c) => c.id);

    return new Response(
      JSON.stringify({
        categories: categoriesList,
        total: categoriesList.length,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      },
    );
  } catch (error) {
    console.error('Error fetching categories:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch categories',
        categories: ['fiction', 'non-fiction', 'science', 'technology', 'reference'], // fallback
        total: 5,
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