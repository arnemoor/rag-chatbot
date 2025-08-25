import { Env } from '../types';
import { R2Operations } from '../r2-operations';
import { CorsHeaders } from '../middleware/cors';

/**
 * Handles R2 list operation
 * @param url The URL object containing query parameters
 * @param env The environment configuration
 * @param corsHeaders The CORS headers to include
 * @returns Response with list of objects
 */
export async function handleR2List(
  url: URL,
  env: Env,
  corsHeaders: CorsHeaders,
): Promise<Response> {
  const prefix = url.searchParams.get('prefix') || '';
  const delimiter = url.searchParams.get('delimiter') || '/';
  const r2ops = new R2Operations(env);

  try {
    const result = await r2ops.list(prefix, delimiter);
    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to list objects' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

/**
 * Handles R2 get/download operation
 * @param pathname The URL pathname containing the key
 * @param env The environment configuration
 * @param corsHeaders The CORS headers to include
 * @returns Response with object content
 */
export async function handleR2Get(
  pathname: string,
  env: Env,
  corsHeaders: CorsHeaders,
): Promise<Response> {
  const key = pathname.substring(8); // Remove '/r2/get/' prefix
  const r2ops = new R2Operations(env);

  try {
    const response = await r2ops.get(decodeURIComponent(key));
    // Add CORS headers to the response
    const newHeaders = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      newHeaders.set(key, value);
    });
    return new Response(response.body, {
      status: response.status,
      headers: newHeaders,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to get object' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

/**
 * Handles R2 upload operation
 * @param request The incoming request with form data
 * @param env The environment configuration
 * @param corsHeaders The CORS headers to include
 * @returns Response with upload result
 */
export async function handleR2Upload(
  request: Request,
  env: Env,
  corsHeaders: CorsHeaders,
): Promise<Response> {
  const r2ops = new R2Operations(env);

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const path = (formData.get('path') as string) || '';

    if (!file || !(file instanceof File)) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Ensure path doesn't have trailing slash and construct key properly
    const cleanPath = path ? path.replace(/\/$/, '') : '';
    const key = cleanPath ? `${cleanPath}/${file.name}` : file.name;
    console.log('Uploading to R2 key:', key);
    const arrayBuffer = await file.arrayBuffer();

    const response = await r2ops.put(key, arrayBuffer, {
      contentType: file.type,
      uploadedAt: new Date().toISOString(),
    });

    return new Response(response.body, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to upload file' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

/**
 * Handles R2 delete operation
 * @param pathname The URL pathname containing the key
 * @param env The environment configuration
 * @param corsHeaders The CORS headers to include
 * @returns Response with deletion result
 */
export async function handleR2Delete(
  pathname: string,
  env: Env,
  corsHeaders: CorsHeaders,
): Promise<Response> {
  const key = pathname.substring(11); // Remove '/r2/delete/' prefix
  const r2ops = new R2Operations(env);

  try {
    const response = await r2ops.delete(decodeURIComponent(key));
    return new Response(response.body, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to delete object' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

/**
 * Handles R2 folder creation
 * @param request The incoming request with folder path
 * @param env The environment configuration
 * @param corsHeaders The CORS headers to include
 * @returns Response with folder creation result
 */
export async function handleR2CreateFolder(
  request: Request,
  env: Env,
  corsHeaders: CorsHeaders,
): Promise<Response> {
  const r2ops = new R2Operations(env);

  try {
    const requestBody = await request.json() as { path?: string };
    const { path } = requestBody;

    if (!path) {
      return new Response(JSON.stringify({ error: 'No path provided' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    const response = await r2ops.createFolder(path);
    return new Response(response.body, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to create folder' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}