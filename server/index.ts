import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { rateLimitMiddleware, securityAnalysisMiddleware } from "./security";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Security middleware - must be applied before routes but exclude static files
app.use((req, res, next) => {
  // Skip security checks for static assets
  if (req.path.startsWith('/assets') || 
      req.path.startsWith('/favicon') || 
      req.path.includes('.js') || 
      req.path.includes('.css') || 
      req.path.includes('.png') || 
      req.path.includes('.jpg') ||
      req.path.includes('.svg')) {
    return next();
  }
  rateLimitMiddleware(req, res, next);
});

app.use((req, res, next) => {
  // Skip security analysis for static assets and auth endpoints initially
  if (req.path.startsWith('/assets') || 
      req.path.startsWith('/favicon') || 
      req.path.includes('.js') || 
      req.path.includes('.css') || 
      req.path.includes('.png') || 
      req.path.includes('.jpg') ||
      req.path.includes('.svg') ||
      req.path === '/' ||
      req.path === '/auth' ||
      req.path === '/landing') {
    return next();
  }
  securityAnalysisMiddleware(req, res, next);
});

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

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use the PORT environment variable in production, fallback to 5000 for development
  const port = process.env.PORT || 5000;
  const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
  
  server.listen({
    port: Number(port),
    host,
    reusePort: process.env.NODE_ENV !== 'production',
  }, () => {
    log(`serving on port ${port} in ${process.env.NODE_ENV || 'development'} mode`);
  });
})();
