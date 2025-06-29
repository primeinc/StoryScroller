import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/unit/setup.ts'],
    include: ['tests/unit/**/*.test.{js,jsx,ts,tsx}'],
    exclude: [
      'tests/functional/**', // Exclude Playwright tests
      'tests/template-example.test.ts',
      '**/node_modules/**', 
      '**/dist/**'
    ],
    // Real timing for performance tests
    testTimeout: 10000,
    // Enable real timers for timing tests
    fakeTimers: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});