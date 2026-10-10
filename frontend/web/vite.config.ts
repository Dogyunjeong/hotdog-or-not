import 'dotenv/config';
import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  ssr: {
    // Workspace packages ship TypeScript source, so bundle them into the server build.
    noExternal: [/^@seamflow\//],
  },
  server: {
    port: 3000,
    strictPort: true,
  },
});
