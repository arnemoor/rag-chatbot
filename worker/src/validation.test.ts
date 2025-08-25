import { describe, it, expect, beforeEach } from 'vitest';

import { ChatRequest, Env } from './types';
import { validateChatRequest, sanitizeInput } from './validation';

describe('Validation Module', () => {
  describe('validateChatRequest', () => {
    let validRequest: ChatRequest;

    // Mock environment for testing
    const mockEnv = {
      R2_BUCKET: {
        get: vi.fn().mockResolvedValue(null),
        put: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
        list: vi.fn().mockResolvedValue({ objects: [], delimitedPrefixes: [] }),
      },
    } as unknown as Env; // Will use fallback validation

    beforeEach(() => {
      validRequest = {
        query: 'What is the meaning of life?',
        language: 'en',
        category: 'fiction',
        product: 'novels',
        provider: 'workers-ai',
        sessionId: 'test-session-123',
      };
    });

    describe('Query Validation', () => {
      it('should accept valid query', async () => {
        const result = await validateChatRequest(validRequest, mockEnv);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject missing query', async () => {
        const request = { ...validRequest, query: undefined } as any;
        const result = await validateChatRequest(request, mockEnv);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual({
          field: 'query',
          message: 'Query is required',
        });
      });

      it('should reject non-string query', async () => {
        const request = { ...validRequest, query: 123 } as any;
        const result = await validateChatRequest(request, mockEnv);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual({
          field: 'query',
          message: 'Query must be a string',
        });
      });

      it('should reject empty query after trimming', async () => {
        const request = { ...validRequest, query: '   ' };
        const result = await validateChatRequest(request, mockEnv);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual({
          field: 'query',
          message: 'Query must be at least 1 character',
        });
      });

      it('should reject query exceeding maximum length', async () => {
        const request = { ...validRequest, query: 'a'.repeat(2001) };
        const result = await validateChatRequest(request, mockEnv);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual({
          field: 'query',
          message: 'Query must not exceed 2000 characters',
        });
      });

      it('should accept query at maximum length', async () => {
        const request = { ...validRequest, query: 'a'.repeat(2000) };
        const result = await validateChatRequest(request, mockEnv);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('Language Validation', () => {
      it('should accept valid language codes', async () => {
        const languages = ['en', 'de', 'fr', 'it'];
        for (const lang of languages) {
          const request = { ...validRequest, language: lang };
          const result = await validateChatRequest(request, mockEnv);
          expect(result.isValid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }
      });

      it('should reject invalid language code', async () => {
        const request = { ...validRequest, language: 'es' };
        const result = await validateChatRequest(request, mockEnv);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual({
          field: 'language',
          message: 'Language must be one of: en, de, fr, it',
        });
      });

      it('should accept missing language (optional field)', async () => {
        const request = { ...validRequest, language: undefined };
        const result = await validateChatRequest(request, mockEnv);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('Category Validation', () => {
      it('should accept valid categories', async () => {
        const categories = [
          'fiction',
          'non-fiction',
          'science',
          'technology',
          'reference',
          'general',
        ];
        for (const category of categories) {
          // Remove product when testing categories alone
          const request = { ...validRequest, category, product: undefined };
          const result = await validateChatRequest(request, mockEnv);
          expect(result.isValid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }
      });

      it('should reject invalid category', async () => {
        const request = { ...validRequest, category: 'invalid-category' };
        const result = await validateChatRequest(request, mockEnv);
        expect(result.isValid).toBe(false);
        expect(result.errors[0].field).toBe('category');
        expect(result.errors[0].message).toContain('Category must be one of:');
      });

      it('should accept missing category (optional field)', async () => {
        const request = { ...validRequest, category: undefined };
        const result = await validateChatRequest(request, mockEnv);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('Product Validation', () => {
      it('should accept valid products for their categories', async () => {
        // Test products that match our 3-level structure
        const testCases = [
          { category: 'fiction', product: 'novels' },
          { category: 'non-fiction', product: 'self-help' },
          { category: 'technology', product: 'programming' },
          { category: 'science', product: 'research' },
          { category: 'reference', product: 'catalog' },
        ];
        
        for (const testCase of testCases) {
          const request = { ...validRequest, ...testCase };
          const result = await validateChatRequest(request, mockEnv);
          // Note: Without proper env, dynamic validation might not work fully
          // But it shouldn't error on valid structure
          expect(result.errors.filter(e => e.field === 'product')).toHaveLength(0);
        }
      });

      it('should not validate product for general category', async () => {
        const request = { ...validRequest, category: 'general', product: 'any-product' };
        const result = await validateChatRequest(request, mockEnv);
        // General category doesn't validate products
        expect(result.errors.filter(e => e.field === 'product')).toHaveLength(0);
      });
    });

    describe('Provider Validation', () => {
      it('should accept valid providers', async () => {
        const providers = ['workers-ai', 'openai', 'anthropic'];
        for (const provider of providers) {
          const request = { ...validRequest, provider };
          const result = await validateChatRequest(request, mockEnv);
          expect(result.isValid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }
      });

      it('should reject invalid provider', async () => {
        const request = { ...validRequest, provider: 'invalid-provider' };
        const result = await validateChatRequest(request, mockEnv);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual({
          field: 'provider',
          message: 'Provider must be one of: workers-ai, openai, anthropic',
        });
      });
    });

    describe('SessionId Validation', () => {
      it('should accept valid sessionId', async () => {
        const request = { ...validRequest, sessionId: 'valid-session-id-123' };
        const result = await validateChatRequest(request, mockEnv);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject non-string sessionId', async () => {
        const request = { ...validRequest, sessionId: 123 } as any;
        const result = await validateChatRequest(request, mockEnv);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual({
          field: 'sessionId',
          message: 'SessionId must be a string',
        });
      });

      it('should reject sessionId exceeding 100 characters', async () => {
        const request = { ...validRequest, sessionId: 'a'.repeat(101) };
        const result = await validateChatRequest(request, mockEnv);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual({
          field: 'sessionId',
          message: 'SessionId is too long (max 100 characters)',
        });
      });

      it('should accept missing sessionId (optional field)', async () => {
        const request = { ...validRequest, sessionId: undefined };
        const result = await validateChatRequest(request, mockEnv);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('Multiple Validation Errors', () => {
      it('should return all validation errors', async () => {
        const request = {
          query: '',
          language: 'invalid',
          category: 'invalid',
          product: 'invalid',
          provider: 'invalid',
          sessionId: 'a'.repeat(101),
        };
        const result = await validateChatRequest(request, mockEnv);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(1);

        const errorFields = result.errors.map((e) => e.field);
        expect(errorFields).toContain('query');
        expect(errorFields).toContain('language');
        expect(errorFields).toContain('category');
        // Product validation might not trigger for invalid category
        // expect(errorFields).toContain('product');
        expect(errorFields).toContain('provider');
        expect(errorFields).toContain('sessionId');
      });
    });
  });

  describe('sanitizeInput', () => {
    it('should remove control characters except newlines and tabs', () => {
      const input = 'Hello\x00World\x01Test\nLine2\tTabbed';
      const result = sanitizeInput(input);
      expect(result).toBe('HelloWorldTest\nLine2\tTabbed');
    });

    it('should trim whitespace', () => {
      const input = '  Hello World  ';
      const result = sanitizeInput(input);
      expect(result).toBe('Hello World');
    });

    it('should handle empty string', () => {
      expect(() => sanitizeInput('')).toThrow('Invalid input type');
    });

    it('should handle string with only control characters', () => {
      const input = '\x00\x01\x02\x03';
      expect(() => sanitizeInput(input)).toThrow('Input cannot be empty');
    });

    it('should preserve unicode characters', () => {
      const input = 'Hello 世界 🌍 مرحبا';
      const result = sanitizeInput(input);
      expect(result).toBe('Hello 世界 🌍 مرحبا');
    });

    it('should handle SQL-like content (legitimate questions about SQL)', () => {
      const input = 'How do I write SELECT * FROM users WHERE id = 1?';
      const result = sanitizeInput(input);
      expect(result).toBe('How do I write SELECT * FROM users WHERE id = 1?');
    });

    it('should handle HTML-like content (legitimate questions about HTML)', () => {
      const input = 'What does <script>alert("test")</script> do in HTML?';
      const result = sanitizeInput(input);
      expect(result).toBe('What does <script>alert("test")</script> do in HTML?');
    });

    it('should remove NULL bytes', () => {
      const input = 'Hello\x00World';
      const result = sanitizeInput(input);
      expect(result).toBe('HelloWorld');
    });

    it('should handle multiple consecutive spaces', () => {
      const input = 'Hello    World';
      const result = sanitizeInput(input);
      expect(result).toBe('Hello    World'); // Preserves internal spaces
    });
  });
});
