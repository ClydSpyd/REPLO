import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      /**
       * The shared package ships a CommonJS `dist` so the CJS API can require
       * it. Point the browser bundle at the TypeScript source instead so Vite
       * transpiles real ESM (CJS named exports aren't resolvable in the browser).
       */
      '@replo/shared': fileURLToPath(
        new URL('../packages/shared/src/index.ts', import.meta.url),
      ),
    },
  },

  build: {
    /**
     * Emit straight into the directory the compiled API serves, so one Express
     * process hosts both the client and the API on a single origin.
     * `emptyOutDir` must be explicit because the target is outside this root.
     */
    outDir: '../api/dist/public',
    emptyOutDir: true,
  },

  server: {
    allowedHosts: ['isorhythmic-haplitic-deane.ngrok-free.dev'],
    proxy: {
      '/api': { target: 'http://localhost:6969', changeOrigin: true },
    },
  },
});
