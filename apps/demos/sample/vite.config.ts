import { defineConfig } from "vite";

// Demo convention: relative base so the build works under /demos/<name>/,
// output to dist/ (scripts/build-demos.mjs copies it into the portfolio).
export default defineConfig({
  base: "./",
});
