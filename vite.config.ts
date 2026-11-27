import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// base: '/' works for a custom domain on GitHub Pages.
// If you deploy to https://<user>.github.io/<repo>/ instead, build with VITE_BASE=/<repo>/
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), tailwindcss()],
  build: { chunkSizeWarningLimit: 1400 },
});
