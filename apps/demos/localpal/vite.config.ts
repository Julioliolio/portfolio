import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Served by the portfolio at <base path>/demos/localpal/ (see
  // scripts/build-demos.mjs, which sets PORTFOLIO_BASE_PATH from
  // scripts/base-path.mjs). The app runtime-fetches public/ assets
  // (map-style.json, fonts), so the base must be the real deploy path —
  // './' is not enough here.
  base: `${process.env.PORTFOLIO_BASE_PATH ?? ""}/demos/localpal/`,
  // Honor the port assigned by the launcher (preview tools set PORT). Vite
  // otherwise ignores PORT and walks 5173→5174→… which desyncs from the
  // proxy when other dev servers already hold those ports.
  server: {
    port: Number(process.env.PORT) || 5173,
  },
});
