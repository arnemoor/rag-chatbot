import { vi } from 'vitest';

import { Env } from './types';

/**
 * Creates a mock environment for testing
 */
export function createMockEnv(overrides?: Partial<Env>): Env {
  return {
    ENVIRONMENT: 'test',
    DEBUG_MODE: 'true',
    ALLOWED_ORIGINS: 'http://localhost:3000',
    R2_BUCKET_NAME: 'test-bucket',
    AUTORAG_INSTANCE_ID: 'test-instance',
    AI: {
      run: vi.fn().mockResolvedValue({
        response: 'Mock AI response for testing',
      }),
    } as any,
    R2_BUCKET: {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      list: vi.fn().mockResolvedValue({ objects: [] }),
    } as any,
    OPENAI_API_KEY: 'test-openai-key',
    ANTHROPIC_API_KEY: 'test-anthropic-key',
    ...overrides,
  };
}

/**
 * Creates a mock Request object for testing
 */
export function createMockRequest(url: string, options?: RequestInit): Request {
  return new Request(url, {
    ...options,
    headers: new Headers(options?.headers),
  });
}

/**
 * Helper to create a JSON POST request
 */
export function createJsonPostRequest(url: string, body: any, headers?: HeadersInit): Request {
  return new Request(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

/**
 * Helper to parse response body as JSON
 */
export async function parseJsonResponse<T = any>(response: Response): Promise<T> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`Failed to parse response as JSON: ${text}`);
  }
}

/**
 * Mock R2 object for testing
 */
export function createMockR2Object(content: string, metadata?: Record<string, string>) {
  return {
    body: new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(content));
        controller.close();
      },
    }),
    bodyUsed: false,
    arrayBuffer: vi.fn().mockResolvedValue(new TextEncoder().encode(content).buffer),
    text: vi.fn().mockResolvedValue(content),
    json: vi.fn().mockResolvedValue(JSON.parse(content)),
    blob: vi.fn(),
    httpMetadata: metadata || {},
    customMetadata: metadata || {},
    key: 'test-key',
    version: '1',
    size: content.length,
    etag: 'test-etag',
    httpEtag: 'test-http-etag',
    checksums: {},
    uploaded: new Date(),
    writeHttpMetadata: vi.fn(),
  };
}

/**
 * Helper to test async error handling
 */
export async function expectAsyncError(
  fn: () => Promise<any>,
  expectedError: string | RegExp,
): Promise<void> {
  try {
    await fn();
    throw new Error('Expected function to throw');
  } catch (error: any) {
    if (typeof expectedError === 'string') {
      expect(error.message).toContain(expectedError);
    } else {
      expect(error.message).toMatch(expectedError);
    }
  }
}

/**
 * Helper to wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100,
): Promise<void> {
  const startTime = Date.now();

  while (!(await condition())) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

/**
 * Mock fetch for external API calls
 */
export function mockFetch(responses: Array<{ url: string | RegExp; response: any }>) {
  const fetchMock = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
    const match = responses.find((r) => {
      if (typeof r.url === 'string') {
        return url.includes(r.url);
      }
      return r.url.test(url);
    });

    if (!match) {
      return Promise.reject(new Error(`No mock found for URL: ${url}`));
    }

    if (match.response instanceof Error) {
      return Promise.reject(match.response);
    }

    return Promise.resolve(
      new Response(
        typeof match.response === 'object' ? JSON.stringify(match.response) : match.response,
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );
  });

  global.fetch = fetchMock as any;
  return fetchMock;
}
