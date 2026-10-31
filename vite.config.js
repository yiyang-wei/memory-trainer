import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Dev only: the /lab review page saves star ratings here, so ratings made on a phone over
// the LAN land in one file on the dev machine. Entries are merged per item code, newest
// wins, and anything that isn't a small well-formed rating is dropped.
function labRatings() {
  const file = path.resolve(".lab/ratings.json");
  const read = () => {
    try {
      return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
      return {};
    }
  };
  const valid = (code, r) =>
    /^[A-Z]\d{2}$/.test(code) &&
    r &&
    Number.isInteger(r.stars) &&
    r.stars >= 0 &&
    r.stars <= 5 &&
    typeof r.note === "string" &&
    r.note.length <= 600 &&
    Number.isFinite(r.t);
  return {
    name: "lab-ratings",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/__lab/ratings", (req, res) => {
        const send = (status, obj) => {
          res.statusCode = status;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(obj));
        };
        if (req.method === "GET") return send(200, read());
        if (req.method !== "POST") return send(405, {});
        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
          if (body.length > 100_000) req.destroy();
        });
        req.on("end", () => {
          let incoming;
          try {
            incoming = JSON.parse(body || "{}");
          } catch {
            return send(400, {});
          }
          const merged = read();
          for (const [code, r] of Object.entries(incoming)) {
            if (!valid(code, r)) continue;
            if (!merged[code] || r.t > (merged[code].t || 0)) {
              merged[code] = { stars: r.stars, note: r.note, t: r.t };
            }
          }
          fs.mkdirSync(path.dirname(file), { recursive: true });
          fs.writeFileSync(file, JSON.stringify(merged, null, 2));
          send(200, merged);
        });
      });
    },
  };
}

// Build only: src/devApps.js routes the other redesign candidates and the Buddy Lab, which
// ship nowhere. Loading it as an empty table keeps the build from following their imports
// at all; an `import.meta.env.DEV` branch would still emit their fonts into dist, where the
// service worker would precache them.
function devOnlyApps() {
  const file = path.resolve("src/devApps.js");
  return {
    name: "dev-only-apps",
    apply: "build",
    enforce: "pre",
    load: (id) => (id === file ? "export default {};" : null),
  };
}

export default defineConfig({
  plugins: [
    react(),
    labRatings(),
    devOnlyApps(),
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
        globPatterns: ["**/*.{js,css,html,svg,png,webmanifest,woff2}"],
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
