import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { AuthenticatedRequest, APIKey, Tenant, APIError } from '../types';

const API_KEY_PREFIX = 'ctx_';
const JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY || '';

// In-memory stores (replace with Redis/database in production)
const apiKeyStore = new Map<string, APIKey>();
const tenantStore = new Map<string, Tenant>();

// Initialize with demo data
initializeDemoData();

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const request = req as AuthenticatedRequest;
  
  // Try API key first (X-API-Key header)
  const apiKey = request.headers['x-api-key'] as string;
  if (apiKey) {
    const validatedKey = validateAPIKey(apiKey);
    if (validatedKey) {
      request.apiKey = validatedKey;
      request.tenant = tenantStore.get(validatedKey.tenantId);
      return next();
    }
  }
  
  // Try JWT Bearer token
  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const validated = validateJWT(token);
    if (validated) {
      request.user = validated;
      return next();
    }
  }
  
  // No valid authentication
  const error: APIError = {
    code: 'UNAUTHORIZED',
    message: 'Valid API key or JWT token required',
    requestId: request.headers['x-request-id'] as string || crypto.randomUUID(),
  };
  res.status(401).json({ error });
}

function validateAPIKey(key: string): APIKey | null {
  if (!key.startsWith(API_KEY_PREFIX)) return null;
  
  const stored = apiKeyStore.get(key);
  if (!stored) return null;
  if (!stored.isActive) return null;
  if (stored.expiresAt && stored.expiresAt < new Date()) return null;
  
  // Update last used
  stored.lastUsedAt = new Date();
  apiKeyStore.set(key, stored);
  
  return stored;
}

function validateJWT(token: string): { id: string; email: string; name: string } | null {
  // Simplified JWT validation (use proper library in production)
  // This is a placeholder - implement proper JWT verification with jose or jsonwebtoken
  try {
    // In production: verify signature, check exp, check iss/aud
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return {
      id: payload.sub || payload.id,
      email: payload.email,
      name: payload.name,
    };
  } catch {
    return null;
  }
}

export function requireScope(...requiredScopes: string[]): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const request = req as AuthenticatedRequest;
    
    if (!request.apiKey) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'API key required' }});
    }
    
    const hasScope = requiredScopes.some(scope => 
      request.apiKey!.scopes.some(s => matchScope(s, scope))
    );
    
    if (!hasScope) {
      const error: APIError = {
        code: 'FORBIDDEN',
        message: `Required scope: ${requiredScopes.join(' or ')}`,
        requestId: crypto.randomUUID(),
      };
      return res.status(403).json({ error });
    }
    
    next();
  };
}

function matchScope(granted: string, required: string): boolean {
  if (granted === required) return true;
  if (granted.endsWith('.*')) {
    const prefix = granted.slice(0, -2);
    return required.startsWith(prefix);
  }
  return false;
}

export function requirePermission(resource: string, action: string): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const request = req as AuthenticatedRequest;
    
    if (!request.apiKey) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'API key required' }});
    }
    
    const hasPermission = request.apiKey.permissions.some(p => 
      p.resource === resource && p.actions.includes(action as any)
    );
    
    if (!hasPermission) {
      const error: APIError = {
        code: 'FORBIDDEN',
        message: `Permission denied: ${resource}:${action}`,
        requestId: crypto.randomUUID(),
      };
      return res.status(403).json({ error });
    }
    
    next();
  };
}

// API Key management
export function createAPIKey(data: Partial<APIKey> & { tenantId: string }): APIKey {
  const key = `${API_KEY_PREFIX}${crypto.randomBytes(24).toString('base64url')}`;
  const apiKey: APIKey = {
    id: `key_${crypto.randomBytes(12).toString('base64url')}`,
    key,
    name: data.name || 'Unnamed Key',
    scopes: data.scopes || ['*'],
    permissions: data.permissions || [
      { resource: 'entries', actions: ['read', 'write'] },
      { resource: 'scopes', actions: ['read'] },
    ],
    rateLimit: data.rateLimit || 1000,
    createdAt: new Date(),
    isActive: true,
    tenantId: data.tenantId,
    ...data,
  };
  
  apiKeyStore.set(key, apiKey);
  return apiKey;
}

export function getAPIKey(key: string): APIKey | undefined {
  return apiKeyStore.get(key);
}

export function revokeAPIKey(key: string): boolean {
  const stored = apiKeyStore.get(key);
  if (!stored) return false;
  stored.isActive = false;
  return true;
}

export function listAPIKeys(tenantId: string): APIKey[] {
  return Array.from(apiKeyStore.values()).filter(k => k.tenantId === tenantId);
}

export function getTenant(id: string): Tenant | undefined {
  return tenantStore.get(id);
}

export function createTenant(data: Partial<Tenant>): Tenant {
  const tenant: Tenant = {
    id: `tenant_${crypto.randomBytes(12).toString('base64url')}`,
    name: data.name || 'Unnamed Tenant',
    tier: data.tier || 'free',
    rateLimit: data.rateLimit || (data.tier === 'enterprise' ? 10000 : data.tier === 'pro' ? 1000 : 100),
    createdAt: new Date(),
    ...data,
  };
  tenantStore.set(tenant.id, tenant);
  return tenant;
}

function initializeDemoData(): void {
  // Demo tenant
  const demoTenant = createTenant({
    id: 'tenant_demo',
    name: 'Demo Organization',
    tier: 'pro',
    rateLimit: 1000,
  });
  
  // Demo API key
  const demoKey = `${API_KEY_PREFIX}d3m0k3y12345678901234567890`;
  const demoAPIKey: APIKey = {
    id: 'key_demo',
    key: demoKey,
    name: 'Demo Key',
    scopes: ['project.*'],
    permissions: [
      { resource: 'entries', actions: ['read', 'write'] },
      { resource: 'scopes', actions: ['read', 'write'] },
      { resource: 'commits', actions: ['read', 'write'] },
      { resource: 'conflicts', actions: ['read', 'write', 'resolve'] },
      { resource: 'webhooks', actions: ['read', 'write'] },
    ],
    rateLimit: 1000,
    createdAt: new Date(),
    isActive: true,
    tenantId: demoTenant.id,
  };
  
  apiKeyStore.set(demoKey, demoAPIKey);
}