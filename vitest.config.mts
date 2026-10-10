import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
      // `server-only` throws outside React Server Components; tests import server code directly.
      'server-only': fileURLToPath(new URL('./test/helpers/serverOnlyStub.ts', import.meta.url)),
    },
  },
  test: {
    // next-intl imports `next/server` without an extension; let Vite resolve it.
    server: { deps: { inline: ['next-intl'] } },
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['**/node_modules/**', '**/.next/**'],
  },
});
