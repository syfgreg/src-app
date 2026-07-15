import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  build: {
    // Desktop M.O.C. Command Center (command.html) is a second, independent
    // entry point alongside the mobile app (index.html) — same build, same
    // deploy, shares all src/data + src/domain code.
    rollupOptions: {
      input: {
        main: "index.html",
        command: "command.html",
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["logo.png", "apple-touch-icon.png"],
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,woff2}"],
        importScripts: ["push-sw.js"],
        // Archive photos load on demand and cache for offline viewing
        runtimeCaching: [
          {
            urlPattern: /\/memories\/.*\.(jpg|JPG|jpeg|png)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "memories-media",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
      manifest: {
        name: "Sea Robin Classic",
        short_name: "Sea Robin",
        description:
          "Official app of the Sea Robin Classic Surf Fishing Tournament — live scoring, records, and lore.",
        theme_color: "#0b0e12",
        background_color: "#0b0e12",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
});
