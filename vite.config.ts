import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import type { Plugin } from 'vite';

/** Preloads the two default fonts so headings don't flash in a fallback font. */
function preloadFonts(): Plugin {
  return {
    name: 'preload-fonts',
    apply: 'build',
    transformIndexHtml(html, ctx) {
      const files = Object.keys(ctx.bundle ?? {}).filter((f) => /(space-grotesk|dm-sans)-latin-wght-normal-.*\.woff2$/.test(f));
      return {
        html,
        tags: files.map((f) => ({
          tag: 'link',
          attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: `${process.env.VITE_BASE ?? '/'}${f}`, crossorigin: '' },
          injectTo: 'head' as const,
        })),
      };
    },
  };
}

// base: '/' works for a custom domain on GitHub Pages.
// If you deploy to https://<user>.github.io/<repo>/ instead, build with VITE_BASE=/<repo>/
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), tailwindcss(), preloadFonts()],
  build: {
    chunkSizeWarningLimit: 1400,
    rolldownOptions: {
      output: {
        // Libraries go in their own files. They rarely change, so browsers keep them cached
        // between deploys and only the small app file is downloaded again.
        advancedChunks: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/ },
            { name: 'motion', test: /node_modules[\\/](gsap|@gsap|lenis)[\\/]/ },
            { name: 'supabase', test: /node_modules[\\/]@supabase[\\/]/ },
          ],
        },
      },
    },
  },
});
