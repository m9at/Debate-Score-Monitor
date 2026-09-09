import express, { type Express, type Request, type Response } from "express";
import path from "node:path";
import fs from "node:fs";

/**
 * In production the API also serves the built web client (single-service deploy).
 * WEB_DIST points at the Vite build output (`artifacts/web/dist/public`).
 */
export const serveWebClient = (app: Express): void => {
  const dist = process.env.WEB_DIST
    ? path.resolve(process.env.WEB_DIST)
    : path.resolve(process.cwd(), "artifacts/web/dist/public");

  const indexHtml = path.join(dist, "index.html");
  if (!fs.existsSync(indexHtml)) {
    process.stdout.write(`[api-server] no web build at ${dist}, skipping static\n`);
    return;
  }

  app.use(express.static(dist, { index: false, maxAge: "1h" }));

  // SPA fallback — everything that is not an API route returns index.html.
  app.get(/^\/(?!api\/).*/, (_req: Request, res: Response) => {
    res.sendFile(indexHtml);
  });

  process.stdout.write(`[api-server] serving web client from ${dist}\n`);
};
