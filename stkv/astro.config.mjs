// @ts-check
import { defineConfig } from 'astro/config';

// Static output: deployable to any static host (Vercel, Netlify, GitHub Pages, school server).
export default defineConfig({
  site: 'https://stkvem.com',
  output: 'static',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
});
