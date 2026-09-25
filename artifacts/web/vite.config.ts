import { defineConfig, createLogger } from "vite";

// The API restarts briefly on code changes; hide the expected
// "connection refused" proxy noise during that window.
const logger = createLogger();
const logError = logger.error;
logger.error = (msg, options) => {
  if (msg.includes("http proxy error") && msg.includes("ECONNREFUSED")) return;
  logError(msg, options);
};
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const rawPort = process.env.PORT;

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH;

if (!basePath) {
  throw new Error(
    "BASE_PATH environment variable is required but was not provided.",
  );
}

export default defineConfig({
  base: basePath,
  customLogger: logger,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    // DISABLE_HMR=true stops the dev server from reloading the page by itself
    // (e.g. after a dropped connection); refresh manually to see code changes.
    hmr: process.env.DISABLE_HMR === "true" ? false : undefined,
    ws: process.env.DISABLE_HMR === "true" ? false : undefined,
    proxy: {
      "/api": {
        target: process.env.API_URL || "http://localhost:5050",
        changeOrigin: true,
        // Don't let a reset API/client socket crash the dev server.
        configure: (proxy) => {
          proxy.on("error", () => {});
        },
      },
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
