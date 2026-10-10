import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts', '**/*.test.tsx', '**/*.test.mts'],
    exclude: ['**/node_modules/**', '**/build/**', '**/dist/**', '**/.react-router/**'],
  },
});
