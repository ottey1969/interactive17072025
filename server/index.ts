import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { rateLimitMiddleware, securityAnalysisMiddleware } from "./security";

const app = express();

// Middleware to parse request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Security middleware (skip for static assets and specific routes)
const staticAssetRegex = /\.(js|css|png|jpg|svg|ico|woff|woff2|ttf)$/i;

app.use((req, res, next) => {
  if (
    req.path.startsWith("/assets") ||
    req.path.startsWith("/favicon") ||
    staticAssetRegex.test(req.path)
  ) {
    return next();
  }
  rateLimitMiddleware(req, res, next);
});

app.use((req, res, next) => {
  if (
    req.path.startsWith("/assets") ||
    req.path.startsWith("/favicon") ||
    staticAssetRegex.test(req.path) ||
    ["/", "/auth", "/landing"].includes(req.path)
  ) {
    return next();
  }
  securityAnalysisMiddleware(req, res, next);
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  log(`Error [${status}]: ${message}`, { error: err });
  res.status(status).json({ message });
});

// Start the server
(async () => {
  const server = await registerRoutes(app);

  // Setup Vite in development mode only
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Environment-aware configuration
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
  const host = process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";

  server.listen(
    {
      port,
      host,
      reusePort: process.env.NODE_ENV !== "production",
    },
    () => {
      log(`🚀 Server running on port ${port} in ${process.env.NODE_ENV || "development"} mode`);
    }
  );
})();
