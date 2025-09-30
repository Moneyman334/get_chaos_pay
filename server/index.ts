import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Redact sensitive fields from objects for logging
function redactSensitiveFields(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sensitiveFields = [
    'apiKey', 'apiSecret', 'accessToken', 'accessTokenSecret',
    'password', 'token', 'secret', 'authorization', 'bearer'
  ];
  
  if (Array.isArray(obj)) {
    return obj.map(item => redactSensitiveFields(item));
  }
  
  const redacted = { ...obj };
  for (const key of Object.keys(redacted)) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      redacted[key] = '[REDACTED]';
    } else if (typeof redacted[key] === 'object') {
      redacted[key] = redactSensitiveFields(redacted[key]);
    }
  }
  
  return redacted;
}

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
        const redacted = redactSensitiveFields(capturedJsonResponse);
        logLine += ` :: ${JSON.stringify(redacted)}`;
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
  // Import and run database health check
  const { storage } = await import("./storage");
  
  try {
    await storage.healthCheck();
  } catch (error) {
    console.error("Failed to start server due to database health check failure:", error);
    process.exit(1);
  }

  const server = await registerRoutes(app);
  
  // Start auto-compound engine
  const { autoCompoundEngine } = await import("./auto-compound-engine");
  try {
    await autoCompoundEngine.start();
  } catch (error) {
    console.error("Failed to start auto-compound engine:", error);
  }
  
  // Start social media scheduler
  const { socialScheduler } = await import("./social-scheduler");
  try {
    socialScheduler.start();
  } catch (error) {
    console.error("Failed to start social media scheduler:", error);
  }

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

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
