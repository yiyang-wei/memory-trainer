import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // The manifest stays hand-maintained in public/, so the plugin only builds the
      // service worker. Workbox stamps the hashed asset names into the precache list at
      // build time — a hand-written list would go stale on every rebuild.
      manifest: false,
      injectRegister: "auto",
      // autoUpdate = skipWaiting + clientsClaim, so a Cloudflare deploy reaches installed
      // users on their next launch instead of stranding them on a cached build forever.
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,webmanifest}"],
        cleanupOutdatedCaches: true,
        navigateFallback: "/index.html",
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
  },
});
