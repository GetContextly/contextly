import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest, Tenant, APIKey } from '../types';

// In-memory rate limit store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
}

export function createRateLimiter(config: RateLimitConfig) {
  const { windowMs, maxRequests, keyGenerator = defaultKeyGenerator } = config;
  
  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();
    
    let record = rateLimitStore.get(key);
    if (!record || record.resetAt <= now) {
      record = { count: 0, resetAt: now + windowMs };
      rateLimitStore.set(key, record);
    }
    
    record.count++;
    
    const remaining = Math.max(0, maxRequests - record.count);
    const resetSeconds = Math.ceil((record.resetAt - now) / 1000);
    
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetSeconds);
    res.setHeader('X-RateLimit-Window', Math.ceil(windowMs / 1000));
    
    if (record.count > maxRequests) {
      res.setHeader('Retry-After', resetSeconds);
      return res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Rate limit exceeded. Try again in ${resetSeconds} seconds.`,
          requestId: crypto.randomUUID(),
        },
      });
    }
    
    next();
  };
}

function defaultKeyGenerator(req: Request): string {
  const authReq = req as AuthenticatedRequest;
  if (authReq.apiKey) {
    return `apikey:${authReq.apiKey.id}`;
  }
  if (authReq.user) {
    return `user:${authReq.user.id}`;
  }
  // Fallback to IP
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  return `ip:${ip}`;
}

// Per-tenant rate limiter based on tenant tier
export function tenantRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const authReq = req as AuthenticatedRequest;
  const tenant = authReq.tenant;
  
  if (!tenant) {
    // No tenant info - use default strict limit
    return createRateLimiter({ windowMs: 60000, maxRequests: 10 })(req, res, next);
  }
  
  const limits: Record<string, { windowMs: number; maxRequests: number }> = {
    free: { windowMs: 60000, maxRequests: 100 },
    pro: { windowMs: 60000, maxRequests: 1000 },
    enterprise: { windowMs: 60000, maxRequests: 10000 },
  };
  
  const limit = limits[tenant.tier] || limits.free;
  
  return createRateLimiter({
    windowMs: limit.windowMs,
    maxRequests: limit.maxRequests,
    keyGenerator: (req) => `tenant:${tenant.id}`,
  })(req, res, next);
}

// Per-API-key rate limiter with key-specific limits
export function apiKeyRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const authReq = req as AuthenticatedRequest;
  
  if (!authReq.apiKey) {
    return next(); // No API key, skip this limiter
  }
  
  const apiKey = authReq.apiKey;
  const windowMs = 60000; // 1 minute
  const maxRequests = apiKey.rateLimit;
  
  return createRateLimiter({
    windowMs,
    maxRequests,
    keyGenerator: (req) => `apikey:${apiKey.id}`,
  })(req, res, next);
}

// Strict limiter for write operations
export function writeOperationLimiter(req: Request, res: Response, next: NextFunction): void {
  const isWrite = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  
  if (!isWrite) {
    return next();
  }
  
  // Stricter limits for write operations
  return createRateLimiter({
    windowMs: 60000,
    maxRequests: 100,
    keyGenerator: defaultKeyGenerator,
  })(req, res, next);
}

// Usage metering middleware
export function usageMetering(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const authReq = req as AuthenticatedRequest;
  
  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    const authReq2 = req as AuthenticatedRequest;
    
    const record = {
      id: `usage_${crypto.randomBytes(8).toString('hex')}`,
      timestamp: new Date(),
      apiKeyId: authReq2.apiKey?.id,
      tenantId: authReq2.tenant?.id,
      scope: (req.body as any)?.scope,
      operation: `${req.method} ${req.path}`,
      tokensUsed: (res as any).tokensUsed || 0,
      durationMs,
      status: res.statusCode >= 400 ? 'error' : 'success',
      errorCode: res.statusCode >= 400 ? `HTTP_${res.statusCode}` : undefined,
    };
    
    // In production, send to analytics pipeline
    console.log('[USAGE]', JSON.stringify(record));
  });
  
  next();
}

// Add tokens used to response for metering
export function trackTokensUsed(req: Request, res: Response, next: NextFunction): void {
  (res as any).tokensUsed = 0;
  next();
}

// Export types for AuthenticatedRequest
interface AuthenticatedRequest extends Request {
  apiKey?: { id: string; rateLimit: number };
  user?: { id: string };
}