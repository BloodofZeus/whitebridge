import { type Request, Response, NextFunction } from "express";
import { createApp } from "../server/createApp";
import { registerRoutes } from "../server/routes";

const REQUIRED_ENV = ['DATABASE_URL', 'SESSION_SECRET'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length > 0) {
  throw new Error(`[vercel] Missing required environment variables: ${missing.join(', ')}`);
}

const app = createApp();

let initialized = false;
let initPromise: Promise<void> | null = null;

function init() {
  if (!initPromise) {
    initPromise = registerRoutes(app).then(() => {
      // Static assets are served by Vercel CDN (outputDirectory: "dist/public")
      // so no serveStatic() call needed here
      app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        res.status(status).json({ message });
      });
      initialized = true;
    });
  }
  return initPromise;
}

export default async function handler(req: Request, res: Response) {
  if (!initialized) await init();
  return app(req, res);
}
