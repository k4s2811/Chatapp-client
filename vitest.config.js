import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  // Use the automatic JSX runtime so test files don't need to import React.
  esbuild: { jsx: 'automatic' },
  resolve: {
    alias: { '@': path.resolve(process.cwd(), 'src') },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    css: false,
    // Unit + component tests only. Playwright E2E lives in /e2e and runs separately.
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    exclude: ['node_modules/**', 'dist/**', 'e2e/**'],
  },
});
