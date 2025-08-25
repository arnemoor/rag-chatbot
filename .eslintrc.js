/* eslint-env node */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: ['eslint:recommended', 'prettier'],
  plugins: ['prettier'],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  ignorePatterns: ['node_modules/', 'dist/', 'coverage/', '*.min.js', 'build/', '.wrangler/'],
  rules: {
    // Prettier integration
    'prettier/prettier': 'error',

    // Basic quality rules
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    'no-debugger': 'error',
    'no-unused-vars': [
      'error',
      {
        args: 'none', // Don't check function arguments
        ignoreRestSiblings: true,
        argsIgnorePattern: '^_',
      },
    ],
    'prefer-const': 'warn',
    'no-var': 'error',

    // Relaxed for framework flexibility
    'no-control-regex': 'off', // We use control chars intentionally
    'no-promise-executor-return': 'off', // Common pattern
    'no-param-reassign': 'off', // Sometimes needed
    'require-atomic-updates': 'off', // Too many false positives
  },
  overrides: [
    // TypeScript files
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: false, // Don't require project for linting
      },
      plugins: ['@typescript-eslint'],
      extends: ['plugin:@typescript-eslint/recommended', 'prettier'],
      rules: {
        // TypeScript specific - relaxed for framework
        '@typescript-eslint/no-explicit-any': 'warn', // Sometimes needed for external APIs
        '@typescript-eslint/explicit-function-return-type': 'off', // Too verbose
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            args: 'none',
            ignoreRestSiblings: true,
            argsIgnorePattern: '^_',
          },
        ],
        '@typescript-eslint/no-unsafe-assignment': 'off', // External APIs
        '@typescript-eslint/no-unsafe-member-access': 'off', // External APIs
        '@typescript-eslint/no-unsafe-call': 'off', // External APIs
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/prefer-nullish-coalescing': 'off', // || is fine
        '@typescript-eslint/no-unnecessary-condition': 'off', // Too many false positives
        '@typescript-eslint/require-await': 'off', // Async for consistency
        '@typescript-eslint/restrict-template-expressions': 'off',
        '@typescript-eslint/no-floating-promises': 'off',
        '@typescript-eslint/no-misused-promises': 'off',
        'no-unused-vars': 'off', // Use TypeScript version
      },
    },
    // Test files
    {
      files: [
        '**/*.test.js',
        '**/*.test.ts',
        '**/*.spec.js',
        '**/*.spec.ts',
        '**/test-*.js',
        '**/test-*.ts',
        '**/test-setup.js',
        '**/test-utils.js',
      ],
      env: {
        jest: true,
        node: true,
      },
      globals: {
        global: 'readonly',
        createMockResponse: 'readonly',
        waitForAsync: 'readonly',
      },
      rules: {
        // Even more relaxed for tests
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'off',
        'no-undef': 'off',
      },
    },
    // Node.js config files
    {
      files: ['*.config.js', '.eslintrc.js', '**/.eslintrc.js', '**/build.js', '**/vitest.config.js'],
      env: {
        node: true,
      },
      globals: {
        module: 'readonly',
        require: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        'no-undef': 'off',
        'no-console': 'off',
      },
    },
  ],
};

