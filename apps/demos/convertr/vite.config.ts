import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

// Demo build: no dev-server proxy (the conversion API is mocked in src/api/),
// dist/ output per the portfolio's demo pipeline (scripts/build-demos.mjs).
export default defineConfig({
  plugins: [solidPlugin()],
  base: './',
  publicDir: 'static',
  build: {
    outDir: 'dist',
    target: 'esnext',
  },
  server: {
    port: parseInt(process.env.PORT || '5173'),
  },
});
