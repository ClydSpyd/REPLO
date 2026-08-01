import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

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
