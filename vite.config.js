import { defineConfig } from 'vite';

// base './' keeps every asset path relative so the same build works on
// GitHub Pages project sites (/repo/), Netlify, or any static host.
export default defineConfig({
  base: './',
  build: { target: 'es2019' },
});
