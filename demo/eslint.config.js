import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tsparser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      // Basic rules that work without plugins
      'no-console': 'off', // Allow console logs for debugging
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',     
      'prefer-const': 'error',
      // Disable rules that don't work well with TypeScript
      'no-unused-vars': 'off', // TypeScript handles this
      'no-undef': 'off', // TypeScript handles this
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    rules: {
      // Allow more lenient rules in test files
      'no-unused-vars': 'off',
      'no-console': 'off',
    },
  },
  {
    ignores: [
      'dist/',
      'node_modules/',
      'coverage/',
      'test-results/',
      'playwright-report/',
      '*.config.js',
      '*.config.ts',
      'scripts/',
    ],
  },
]