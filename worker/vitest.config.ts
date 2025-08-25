import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    // Use the Cloudflare Workers test environment
    poolOptions: {
      workers: {
        wrangler: {
          configPath: './wrangler.toml',
        },
        miniflare: {
          // Test environment bindings
          bindings: {
            ENVIRONMENT: 'test',
            DEBUG_MODE: 'true',
            ALLOWED_ORIGINS: 'http://localhost:3000,http://localhost:8080',
            R2_BUCKET_NAME: 'test-bucket',
            AUTORAG_INSTANCE_ID: 'test-instance',
            GATEWAY_NAME: 'test-gateway',
          },
          r2Buckets: {
            R2_BUCKET: 'test-bucket',
          },
        },
      },
    },
    // Coverage configuration
    // Note: Coverage is disabled by default due to incompatibility with Workers environment
    // Run with --coverage flag locally when needed
    coverage: {
      enabled: false, // Disabled due to node:inspector incompatibility
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/types.ts',
        'vitest.config.ts',
      ],
      // Thresholds are goals, not enforced in CI due to coverage issues
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 80,
        lines: 80,
      },
    },
    // Test configuration
    globals: true,
    // Remove the environment line - Workers pool handles this
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    isolate: true,
    // Reporter configuration
    reporters: ['default', 'html'],
    outputFile: {
      html: './coverage/index.html',
    },
  },
});
