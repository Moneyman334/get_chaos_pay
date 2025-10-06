import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import crypto from "crypto";

// Security configuration
export const SECURITY_CONFIG = {
  // Rate limiting tiers
  RATE_LIMITS: {
    STRICT: { windowMs: 15 * 60 * 1000, max: 10 }, // Auth endpoints
    MODERATE: { windowMs: 15 * 60 * 1000, max: 100 }, // General API
    RELAXED: { windowMs: 15 * 60 * 1000, max: 500 }, // Public data
    TRADING: { windowMs: 1 * 60 * 1000, max: 60 }, // Trading endpoints - 60 per minute
    PAYMENT: { windowMs: 15 * 60 * 1000, max: 20 }, // Payment endpoints
  },
  
  // Request validation
  MAX_REQUEST_SIZE: '10mb',
  ALLOWED_CONTENT_TYPES: ['application/json', 'application/x-www-form-urlencoded'],
  
  // Security headers
  SECURITY_HEADERS: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https: wss: data:; object-src 'none'; base-uri 'self'; form-action 'self'",
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  },
  
  // Input sanitization patterns
  DANGEROUS_PATTERNS: [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /eval\(/gi,
    /expression\(/gi,
  ],
};

// Advanced rate limiter factory
export function createRateLimiter(tier: keyof typeof SECURITY_CONFIG.RATE_LIMITS, customMessage?: string) {
  const config = SECURITY_CONFIG.RATE_LIMITS[tier];
  
  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    message: customMessage || {
      error: `Too many requests from this IP, please try again later.`,
      retryAfter: `${Math.floor(config.windowMs / 1000 / 60)} minutes`
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip successful requests for better performance
    skipSuccessfulRequests: false,
    // Handler for when limit is exceeded
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: Math.floor(config.windowMs / 1000),
        timestamp: new Date().toISOString(),
      });
    },
  });
}

// Speed limiter for gradual slowdown
export function createSpeedLimiter(tier: keyof typeof SECURITY_CONFIG.RATE_LIMITS) {
  const config = SECURITY_CONFIG.RATE_LIMITS[tier];
  
  return slowDown({
    windowMs: config.windowMs,
    delayAfter: Math.floor(config.max * 0.5), // Start slowing after 50% of limit
    delayMs: (used: number) => (used - Math.floor(config.max * 0.5)) * 100, // 100ms per request over half
    maxDelayMs: 3000, // Max 3 second delay
  });
}

// Security headers middleware
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Apply all security headers
  Object.entries(SECURITY_CONFIG.SECURITY_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  // Remove powered-by header
  res.removeHeader('X-Powered-By');
  
  next();
}

// Input sanitization middleware
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  
  next();
}

// Recursive object sanitization
function sanitizeObject(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  return obj;
}

// String sanitization
function sanitizeString(str: string): string {
  let sanitized = str;
  
  // Remove dangerous patterns
  for (const pattern of SECURITY_CONFIG.DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  return sanitized;
}

// Request signature verification (for critical operations)
export function verifyRequestSignature(secret: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const signature = req.headers['x-signature'] as string;
    const timestamp = req.headers['x-timestamp'] as string;
    
    if (!signature || !timestamp) {
      return res.status(401).json({ error: 'Missing security headers' });
    }
    
    // Check timestamp is within 5 minutes
    const now = Date.now();
    const requestTime = parseInt(timestamp);
    if (Math.abs(now - requestTime) > 5 * 60 * 1000) {
      return res.status(401).json({ error: 'Request timestamp expired' });
    }
    
    // Verify signature
    const payload = JSON.stringify(req.body) + timestamp;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    if (signature !== expectedSignature) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    next();
  };
}

// IP whitelist middleware (for admin endpoints)
export function ipWhitelist(allowedIps: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIp = req.ip || req.headers['x-forwarded-for'] as string;
    
    if (!allowedIps.includes(clientIp)) {
      return res.status(403).json({ error: 'Access denied from this IP' });
    }
    
    next();
  };
}

// Transaction fraud detection
export interface TransactionRiskScore {
  score: number; // 0-100
  flags: string[];
  recommendation: 'approve' | 'review' | 'reject';
}

export function analyzeTransactionRisk(transaction: {
  fromAddress: string;
  toAddress: string;
  amount: string;
  gasPrice?: string;
}): TransactionRiskScore {
  const flags: string[] = [];
  let score = 0;
  
  // Check for suspicious patterns
  const amount = parseFloat(transaction.amount);
  
  // Very large transactions
  if (amount > 1000000) {
    flags.push('LARGE_AMOUNT');
    score += 30;
  }
  
  // Suspiciously low gas price
  if (transaction.gasPrice && parseFloat(transaction.gasPrice) < 1000000000) {
    flags.push('LOW_GAS_PRICE');
    score += 20;
  }
  
  // Same from/to address
  if (transaction.fromAddress.toLowerCase() === transaction.toAddress.toLowerCase()) {
    flags.push('SELF_TRANSFER');
    score += 15;
  }
  
  // Known blacklisted addresses (example - expand with real blacklist)
  const blacklist = ['0x0000000000000000000000000000000000000000'];
  if (blacklist.includes(transaction.fromAddress.toLowerCase()) || 
      blacklist.includes(transaction.toAddress.toLowerCase())) {
    flags.push('BLACKLISTED_ADDRESS');
    score += 50;
  }
  
  // Determine recommendation
  let recommendation: 'approve' | 'review' | 'reject';
  if (score >= 70) {
    recommendation = 'reject';
  } else if (score >= 40) {
    recommendation = 'review';
  } else {
    recommendation = 'approve';
  }
  
  return { score, flags, recommendation };
}

// Enhanced error handler with security-aware responses
export function secureErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // Log full error internally
  console.error('Security Error:', {
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });
  
  // Send safe error to client
  const status = err.status || err.statusCode || 500;
  
  // Never expose internal errors in production
  const message = status === 500 && process.env.NODE_ENV === 'production'
    ? 'An unexpected error occurred'
    : err.message || 'Internal Server Error';
  
  res.status(status).json({
    error: message,
    timestamp: new Date().toISOString(),
    requestId: crypto.randomUUID(),
  });
}

// CORS configuration for production
export const CORS_CONFIG = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:5000',
      /\.replit\.app$/,
      /\.replit\.dev$/,
    ];
    
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return allowed === origin;
      }
      return allowed.test(origin);
    });
    
    callback(null, isAllowed);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Signature', 'X-Timestamp'],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
  maxAge: 86400, // 24 hours
};

// Request logging with security focus
export function securityLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Log suspicious activity
    if (res.statusCode === 401 || res.statusCode === 403 || res.statusCode === 429) {
      console.warn('Security Event:', {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        duration,
      });
    }
  });
  
  next();
}

// Database query sanitization helper
export function sanitizeDbInput(input: string): string {
  // Remove SQL injection attempts
  return input
    .replace(/['";]/g, '') // Remove quotes and semicolons
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove block comments
    .replace(/\*\//g, '')
    .trim();
}

// Cryptographic utilities
export const crypto_utils = {
  // Generate secure random token
  generateToken: (length: number = 32): string => {
    return crypto.randomBytes(length).toString('hex');
  },
  
  // Hash sensitive data
  hashData: (data: string): string => {
    return crypto.createHash('sha256').update(data).digest('hex');
  },
  
  // Encrypt sensitive data
  encrypt: (text: string, key: string): string => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key.padEnd(32, '0').substring(0, 32)), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  },
  
  // Decrypt sensitive data
  decrypt: (encryptedText: string, key: string): string => {
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key.padEnd(32, '0').substring(0, 32)), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  },
};

// API key validation middleware
export function validateApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  
  // Validate API key format
  if (!/^[a-zA-Z0-9]{32,64}$/.test(apiKey)) {
    return res.status(401).json({ error: 'Invalid API key format' });
  }
  
  // Here you would validate against stored API keys
  // For now, we'll assume validation happens elsewhere
  
  next();
}

// Export all middleware as fortress
export const SecurityFortress = {
  createRateLimiter,
  createSpeedLimiter,
  securityHeaders,
  sanitizeInput,
  verifyRequestSignature,
  ipWhitelist,
  analyzeTransactionRisk,
  secureErrorHandler,
  securityLogger,
  sanitizeDbInput,
  crypto_utils,
  validateApiKey,
  SECURITY_CONFIG,
  CORS_CONFIG,
};
