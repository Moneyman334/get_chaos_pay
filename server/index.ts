import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { neon } from "@neondatabase/serverless";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { SecurityFortress } from "./security-fortress";
import { FortressShield } from "./fortress-shield";
import cors from "cors";

const app = express();

// Apply CORS before other middleware
app.use(cors(SecurityFortress.CORS_CONFIG));

// 🛡️ FORTRESS SHIELD LAYER 1: DDoS Protection
app.use(FortressShield.ddosProtection);

// 🛡️ FORTRESS SHIELD LAYER 2: Honeypot Traps
app.use(FortressShield.honeypotTrap);

// 🛡️ FORTRESS SHIELD LAYER 3: Advanced Threat Detection
app.use(FortressShield.advancedThreatDetection);

// 🛡️ FORTRESS SHIELD LAYER 4: Request Integrity Check
app.use(FortressShield.requestIntegrityCheck);

// Security headers fortress
app.use(SecurityFortress.securityHeaders);

// Security logging
app.use(SecurityFortress.securityLogger);

// Body parsing with size limits
app.use(express.json({ limit: SecurityFortress.SECURITY_CONFIG.MAX_REQUEST_SIZE }));
app.use(express.urlencoded({ extended: false, limit: SecurityFortress.SECURITY_CONFIG.MAX_REQUEST_SIZE }));

// Input sanitization fortress
app.use(SecurityFortress.sanitizeInput);

// Trust Replit proxy for secure cookies
app.set('trust proxy', 1);

// Configure PostgreSQL session store
const PgSession = connectPgSimple(session);
const sessionDb = neon(process.env.DATABASE_URL!);

app.use(
  session({
    store: new PgSession({
      conObject: {
        connectionString: process.env.DATABASE_URL!,
      },
      tableName: 'session',
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || 'codex-casino-secret-key-change-in-production',
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    },
  })
);

// 🛡️ FORTRESS SHIELD LAYER 5: CSRF Protection
app.use(FortressShield.csrfProtection);

// 🛡️ FORTRESS SHIELD LAYER 6: Security Audit Logging
app.use(FortressShield.securityAuditLog);

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

  // Seed platform addresses
  const { seedPlatformAddresses } = await import("./platform-addresses-seed");
  try {
    await seedPlatformAddresses(storage);
  } catch (error) {
    console.error("Failed to seed platform addresses:", error);
  }

  // Seed demo wallets for owner
  const { seedDemoWallets } = await import("./seed-demo-wallets");
  try {
    await seedDemoWallets(storage);
  } catch (error) {
    console.error("Failed to seed demo wallets:", error);
  }

  // Seed Empire Pass subscription plans
  const { seedEmpirePassPlans } = await import("./seed-empire-pass");
  try {
    await seedEmpirePassPlans();
  } catch (error) {
    console.error("Failed to seed Empire Pass plans:", error);
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
  
  // Initialize price service with live CoinGecko data
  const { initializePriceService } = await import("./price-service");
  try {
    await initializePriceService();
  } catch (error) {
    console.error("Failed to initialize price service:", error);
  }

  // Use secure error handler
  app.use(SecurityFortress.secureErrorHandler);

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

  // Graceful shutdown handler with idempotency guard
  let isShuttingDown = false;
  let shutdownPromise: Promise<void> | null = null;

  const gracefulShutdown = async (signal: string) => {
    // Prevent concurrent shutdowns
    if (isShuttingDown) {
      log(`Shutdown already in progress, ignoring ${signal}`);
      return shutdownPromise;
    }

    isShuttingDown = true;
    log(`Received ${signal}, starting graceful shutdown...`);

    shutdownPromise = (async () => {
      let cleanupComplete = false;
      let hasErrors = false;

      // Note: We don't force exit on timeout anymore - let cleanup complete
      // The timeout is just to log a warning
      const forceTimeout = setTimeout(() => {
        if (!cleanupComplete) {
          log('Warning: cleanup taking longer than 10 seconds...');
        }
      }, 10000);

      try {
        // Stop accepting new connections
        try {
          await new Promise<void>((resolve, reject) => {
            server.close((err) => {
              if (err) reject(err);
              else {
                log('HTTP server closed');
                resolve();
              }
            });
          });
        } catch (error) {
          hasErrors = true;
          console.error('Error closing HTTP server:', error);
          // Continue with other cleanup steps
        }

        // Stop auto-compound engine
        try {
          const { autoCompoundEngine } = await import("./auto-compound-engine");
          await autoCompoundEngine.stop();
          log('Auto-compound engine stopped');
        } catch (error) {
          hasErrors = true;
          console.error('Error stopping auto-compound engine:', error);
          // Continue with other cleanup steps
        }

        // Stop social scheduler
        try {
          const { socialScheduler } = await import("./social-scheduler");
          socialScheduler.stop();
          log('Social scheduler stopped');
        } catch (error) {
          hasErrors = true;
          console.error('Error stopping social scheduler:', error);
        }

        cleanupComplete = true;
        clearTimeout(forceTimeout);
        
        if (hasErrors) {
          log('Graceful shutdown complete with errors');
          process.exit(1);
        } else {
          log('Graceful shutdown complete');
          process.exit(0);
        }
      } catch (error) {
        console.error('Unexpected error during graceful shutdown:', error);
        clearTimeout(forceTimeout);
        process.exit(1);
      }
    })();

    return shutdownPromise;
  };

  // Handle graceful shutdown signals
  process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => void gracefulShutdown('SIGINT'));

  // Handle uncaught errors - must not use async handlers or await
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    void gracefulShutdown('UNCAUGHT_EXCEPTION');
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    void gracefulShutdown('UNHANDLED_REJECTION');
  });
})();
