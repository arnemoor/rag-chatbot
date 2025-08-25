import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Use jsdom for browser-like environment
    environment: 'jsdom',
    // Setup files to run before tests
    setupFiles: ['./src/test-setup.js'],
    // Global test APIs
    globals: true,
    // Coverage configuration
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'demo/**',
        'build.js',
        '**/*.test.js',
        '**/*.spec.js',
        '**/test-*.js',
        'vitest.config.js',
        'src/config.js.template',
        'src/playground.html',
        'src/demo.html',
        'src/iframe.html',
        'src/r2browser.html',
      ],
      include: ['src/**/*.js'],
      thresholds: {
        statements: 70,
        branches: 60,
        functions: 70,
        lines: 70,
      },
    },
    // Test timeout
    testTimeout: 10000,
    // Isolate tests for web components
    isolate: true,
    // Pool options
    pool: 'threads',
    // Reporter configuration
    reporters: ['default', 'html'],
    outputFile: {
      html: './coverage/index.html',
    },
    // Mock configuration
    mockReset: true,
    restoreMocks: true,
    // Include/exclude patterns
    include: ['src/**/*.test.js', 'src/**/*.spec.js'],
    exclude: ['node_modules', 'dist', 'demo'],
  },
  // Resolve configuration for modules
  resolve: {
    alias: {
      dompurify: 'dompurify/dist/purify.js',
    },
  },
});
