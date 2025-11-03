/**
 * AutoRAG-related route handlers
 */

import type { Env, CorsHeaders } from '../types';

/**
 * Get AutoRAG job logs
 */
export async function handleAutoRAGJobLogs(
  jobId: string,
  env: Env,
  corsHeaders: CorsHeaders
): Promise<Response> {
  try {
    const accountId = env.CLOUDFLARE_ACCOUNT_ID;
    const autoragId = env.AUTORAG_INSTANCE_ID || env.AUTORAG_INSTANCE;
    const apiToken = env.CLOUDFLARE_API_TOKEN;

    if (!accountId || !autoragId || !apiToken) {
      return new Response(
        JSON.stringify({
          error: 'Missing required configuration for AutoRAG',
          details: 'CLOUDFLARE_ACCOUNT_ID, AUTORAG_INSTANCE_ID, or CLOUDFLARE_API_TOKEN not configured'
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Call Cloudflare AutoRAG API to get job logs
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/autorag/rags/${autoragId}/jobs/${jobId}/logs`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await response.json() as any;

    if (!response.ok) {
      console.error('AutoRAG job logs fetch failed:', {
        status: response.status,
        result: JSON.stringify(result, null, 2)
      });

      return new Response(
        JSON.stringify({
          error: 'Failed to get job logs',
          details: result.errors || result.error || 'Unknown error',
          status: response.status
        }),
        {
          status: response.status,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Return job logs
    return new Response(
      JSON.stringify({
        success: true,
        logs: result.result
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching AutoRAG job logs:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

/**
 * Get AutoRAG job status
 */
export async function handleAutoRAGJobStatus(
  jobId: string,
  env: Env,
  corsHeaders: CorsHeaders
): Promise<Response> {
  try {
    const accountId = env.CLOUDFLARE_ACCOUNT_ID;
    const autoragId = env.AUTORAG_INSTANCE_ID || env.AUTORAG_INSTANCE;
    const apiToken = env.CLOUDFLARE_API_TOKEN;

    if (!accountId || !autoragId || !apiToken) {
      return new Response(
        JSON.stringify({
          error: 'Missing required configuration for AutoRAG',
          details: 'CLOUDFLARE_ACCOUNT_ID, AUTORAG_INSTANCE_ID, or CLOUDFLARE_API_TOKEN not configured'
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Call Cloudflare AutoRAG API to get job status
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/autorag/rags/${autoragId}/jobs/${jobId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await response.json() as any;

    if (!response.ok) {
      console.error('AutoRAG job status check failed:', {
        status: response.status,
        result: JSON.stringify(result, null, 2)
      });

      return new Response(
        JSON.stringify({
          error: 'Failed to get job status',
          details: result.errors || result.error || 'Unknown error',
          status: response.status
        }),
        {
          status: response.status,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Return job status
    return new Response(
      JSON.stringify({
        success: true,
        job: result.result
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error checking AutoRAG job status:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

/**
 * Trigger AutoRAG indexing/sync
 */
export async function handleAutoRAGSync(
  env: Env,
  corsHeaders: CorsHeaders
): Promise<Response> {
  try {
    // Get Cloudflare account ID and AutoRAG instance ID from environment
    const accountId = env.CLOUDFLARE_ACCOUNT_ID;
    const autoragId = env.AUTORAG_INSTANCE_ID || env.AUTORAG_INSTANCE;
    const apiToken = env.CLOUDFLARE_API_TOKEN;

    if (!accountId || !autoragId || !apiToken) {
      return new Response(
        JSON.stringify({
          error: 'Missing required configuration for AutoRAG sync',
          details: 'CLOUDFLARE_ACCOUNT_ID, AUTORAG_INSTANCE_ID, or CLOUDFLARE_API_TOKEN not configured'
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Call Cloudflare AutoRAG API to trigger sync
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/autorag/rags/${autoragId}/sync`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await response.json() as any;

    if (!response.ok) {
      // Log detailed error for debugging
      console.error('AutoRAG sync failed:', {
        status: response.status,
        statusText: response.statusText,
        result: JSON.stringify(result, null, 2),
        accountId,
        autoragId: autoragId.substring(0, 10) + '...' // Partial ID for privacy
      });

      // Format error details for user
      let errorDetails = result.errors || result.error || 'Unknown error';
      if (Array.isArray(errorDetails)) {
        errorDetails = errorDetails.map((e: any) => e.message || e).join(', ');
      } else if (typeof errorDetails === 'object') {
        errorDetails = JSON.stringify(errorDetails);
      }

      return new Response(
        JSON.stringify({
          error: 'Failed to trigger AutoRAG sync',
          details: errorDetails,
          status: response.status,
          debug: env.DEBUG_MODE === 'true' ? {
            endpoint: `accounts/${accountId}/autorag/rags/${autoragId}/sync`,
            hasToken: !!apiToken
          } : undefined
        }),
        {
          status: response.status,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Extract job ID if available
    const jobId = result.result?.job_id || result.job_id;

    return new Response(
      JSON.stringify({
        success: true,
        message: 'AutoRAG indexing triggered successfully',
        job_id: jobId,
        result: result.result
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error triggering AutoRAG sync:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
}