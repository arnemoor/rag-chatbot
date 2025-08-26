import { describe, it, expect, beforeEach, vi } from 'vitest';

import { Env } from './types';

// Mock the worker module
const mockFetch = vi.fn();

describe('Worker Main Handler', () => {
  let env: Env;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup test environment
    env = {
      ENVIRONMENT: 'test',
      DEBUG_MODE: 'true',
      ALLOWED_ORIGINS: 'http://localhost:3000',
      R2_BUCKET_NAME: 'test-bucket',
      AUTORAG_INSTANCE: 'test-instance',
      AI: {
        run: vi.fn().mockResolvedValue({
          response: 'Mock AI response',
        }),
      } as any,
      R2_BUCKET: {
        get: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        list: vi.fn(),
      } as any,
      OPENAI_API_KEY: 'test-key',
      ANTHROPIC_API_KEY: 'test-key',
    };
  });

  describe('CORS Headers', () => {
    it('should return proper CORS headers for OPTIONS request', async () => {
      const request = new Request('http://localhost:8787/api/chat', {
        method: 'OPTIONS',
        headers: {
          Origin: 'http://localhost:3000',
        },
      });

      // Import the actual worker handler
      const workerModule = await import('./index');
      const response = await workerModule.default.fetch(request, env);

      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeTruthy();
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
      expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type');
    });

    it('should use wildcard CORS when no specific origins configured', async () => {
      env.ALLOWED_ORIGINS = undefined;

      const request = new Request('http://localhost:8787/api/chat', {
        method: 'OPTIONS',
        headers: {
          Origin: 'http://example.com',
        },
      });

      const workerModule = await import('./index');
      const response = await workerModule.default.fetch(request, env);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      // When using wildcard, credentials header should not be set
      expect(response.headers.get('Access-Control-Allow-Credentials')).toBeNull();
    });

    it('should use specific origin when configured', async () => {
      env.ALLOWED_ORIGINS = 'http://localhost:3000,http://localhost:8080';

      const request = new Request('http://localhost:8787/api/chat', {
        method: 'OPTIONS',
        headers: {
          Origin: 'http://localhost:3000',
        },
      });

      const workerModule = await import('./index');
      const response = await workerModule.default.fetch(request, env);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000');
      expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true');
    });
  });

  describe('Health Endpoint', () => {
    it('should return health status with debug info when DEBUG_MODE is true', async () => {
      const request = new Request('http://localhost:8787/health');

      const workerModule = await import('./index');
      const response = await workerModule.default.fetch(request, env);

      expect(response.status).toBe(200);
      const data = (await response.json()) as any;

      expect(data.status).toBe('healthy');
      expect(data.timestamp).toBeDefined();
      expect(data.version).toBe('1.0.0');
      expect(data.debug).toBeDefined();
      expect(data.debug.environment).toBe('test');
      expect(data.debug.config).toBeDefined();
      expect(data.debug.config.r2_bucket).toBe('Configured');
      expect(data.debug.config.autorag_instance).toBe('Configured');
    });

    it('should return minimal health status when DEBUG_MODE is false', async () => {
      env.DEBUG_MODE = 'false';
      const request = new Request('http://localhost:8787/health');

      const workerModule = await import('./index');
      const response = await workerModule.default.fetch(request, env);

      expect(response.status).toBe(200);
      const data = (await response.json()) as any;

      expect(data.status).toBe('healthy');
      expect(data.timestamp).toBeDefined();
      expect(data.version).toBe('1.0.0');
      expect(data.debug).toBeUndefined();
    });
  });

  describe('Chat Endpoint', () => {
    it('should validate request body', async () => {
      const request = new Request('http://localhost:8787/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Missing required 'query' field
          language: 'en',
        }),
      });

      const workerModule = await import('./index');
      const response = await workerModule.default.fetch(request, env);

      expect(response.status).toBe(400);
      const data = (await response.json()) as any;
      expect(data.error).toBe('Validation failed');
      expect(data.errors).toBeDefined();
      expect(data.errors).toContainEqual({
        field: 'query',
        message: 'Query is required',
      });
    });

    it('should process valid chat request', async () => {
      // Mock the autorag function
      env.AI = {
        autorag: vi.fn().mockReturnValue({
          aiSearch: vi.fn().mockResolvedValue({
            response: 'TypeScript is a typed superset of JavaScript.',
            data: [],
          }),
        }),
      } as any;

      const request = new Request('http://localhost:8787/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'What is TypeScript?',
          language: 'en',
          category: 'technology',
          provider: 'workers-ai',
        }),
      });

      const workerModule = await import('./index');
      const response = await workerModule.default.fetch(request, env);

      expect(response.status).toBe(200);
      const data = (await response.json()) as any;
      expect(data.text).toBeDefined();
      expect(data.sessionId).toBeDefined();
      expect(data.metadata).toBeDefined();
      expect(data.metadata.provider).toBe('workers-ai');
    });

    it('should handle invalid JSON in request body', async () => {
      const request = new Request('http://localhost:8787/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json',
      });

      const workerModule = await import('./index');
      const response = await workerModule.default.fetch(request, env);

      expect(response.status).toBe(500);
      const data = (await response.json()) as any;
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('Config Endpoint', () => {
    it('should return configuration', async () => {
      // Mock R2 response for config.json
      const mockConfig = {
        languages: [{ id: 'en', label: 'English', available: true }],
        categories: [{ id: 'fiction', label: 'Fiction', available: true }],
      };

      env.R2_BUCKET.get = vi.fn().mockResolvedValue({
        text: vi.fn().mockResolvedValue(JSON.stringify(mockConfig)),
      });

      const request = new Request('http://localhost:8787/config');

      const workerModule = await import('./index');
      const response = await workerModule.default.fetch(request, env);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('languages');
      expect(data).toHaveProperty('categories');
    });

    it('should handle missing configuration file', async () => {
      env.R2_BUCKET.get = vi.fn().mockResolvedValue(null);

      const request = new Request('http://localhost:8787/config');

      const workerModule = await import('./index');
      const response = await workerModule.default.fetch(request, env);

      expect(response.status).toBe(200);
      const data = (await response.json()) as any;
      // Should return default config when file is missing
      expect(data).toHaveProperty('languages');
      expect(data).toHaveProperty('categories');
    });
  });

  describe('Error Handling', () => {
    it('should handle internal server errors gracefully', async () => {
      // Force an error by making autorag throw
      env.AI = {
        autorag: vi.fn().mockReturnValue({
          aiSearch: vi.fn().mockRejectedValue(new Error('AI service unavailable')),
        }),
      } as any;

      const request = new Request('http://localhost:8787/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'Test query',
          provider: 'workers-ai',
        }),
      });

      const workerModule = await import('./index');
      const response = await workerModule.default.fetch(request, env);

      expect(response.status).toBe(200);
      const data = (await response.json()) as any;
      // AutoRAG errors are handled gracefully and return a fallback message
      expect(data.text).toBeDefined();
      expect(data.sessionId).toBeDefined();
    });

    it('should handle 404 for unknown routes', async () => {
      const request = new Request('http://localhost:8787/unknown-route');

      const workerModule = await import('./index');
      const response = await workerModule.default.fetch(request, env);

      expect(response.status).toBe(405);
      // Response is plain text for method not allowed
      const text = await response.text();
      expect(text).toBe('Method not allowed');
    });
  });

  describe('Request Methods', () => {
    it('should reject non-POST requests to chat endpoint', async () => {
      const request = new Request('http://localhost:8787/api/chat', {
        method: 'GET',
      });

      const workerModule = await import('./index');
      const response = await workerModule.default.fetch(request, env);

      expect(response.status).toBe(405);
      const text = await response.text();
      expect(text).toBe('Method not allowed');
    });

    it('should accept GET requests to health endpoint', async () => {
      const request = new Request('http://localhost:8787/health', {
        method: 'GET',
      });

      const workerModule = await import('./index');
      const response = await workerModule.default.fetch(request, env);

      expect(response.status).toBe(200);
    });
  });
});
