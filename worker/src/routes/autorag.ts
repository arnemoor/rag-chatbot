/**
 * AutoRAG-related route handlers
 */

import type { Env, CorsHeaders } from '../types';

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
      return new Response(
        JSON.stringify({
          error: 'Failed to trigger AutoRAG sync',
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