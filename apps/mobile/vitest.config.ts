import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

/**
 * Vitest for the app's non-React logic.
 *
 * The `@/` alias mirrors `tsconfig.json`, so tests import modules the same way
 * the app does. There is no React Native runtime here: components are not
 * covered by these tests, only the pure helpers and the stores, whose native
 * dependencies are mocked per test file.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    clearMocks: true,
  },
});
