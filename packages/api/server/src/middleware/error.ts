import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ValidationError } from 'joi';
import crypto from 'crypto';

export class APIError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, any>;

  constructor(code: string, message: string, statusCode: number = 500, details?: Record<string, any>) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  const requestId = crypto.randomUUID();

  // Log the error
  console.error(`[${requestId}] Error:`, {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request parameters',
        details: err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        })),
        requestId,
      },
    });
  }

  // Joi validation errors
  if (err instanceof ValidationError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request parameters',
        details: err.details.map(e => ({
          field: e.path.join('.'),
          message: e.message,
          type: e.type,
        })),
        requestId,
      },
    });
  }

  // Custom API errors
  if (err instanceof APIError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        requestId,
      },
    });
  }

  // Syntax errors (JSON parse errors)
  if (err instanceof SyntaxError && 'status' in err && err.status === 400) {
    return res.status(400).json({
      error: {
        code: 'INVALID_JSON',
        message: 'Invalid JSON in request body',
        requestId,
      },
    });
  }

  // Default server error
  const isDev = process.env.NODE_ENV !== 'production';
  const errorResponse: any = {
    error: {
      code: 'INTERNAL_ERROR',
      message: isDev ? err.message : 'Internal server error',
      requestId,
    },
  };
  if (isDev && err.stack) {
    errorResponse.error.stack = err.stack;
  }
  return res.status(500).json(errorResponse);
}

export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Helper to create typed errors
export const errors = {
  notFound: (resource: string, id?: string) =>
    new APIError('NOT_FOUND', `${resource}${id ? ` (${id})` : ''} not found`, 404),

  conflict: (message: string, details?: Record<string, any>) =>
    new APIError('CONFLICT', message, 409, details),

  forbidden: (message: string = 'Access denied') =>
    new APIError('FORBIDDEN', message, 403),

  unauthorized: (message: string = 'Authentication required') =>
    new APIError('UNAUTHORIZED', message, 401),

  badRequest: (message: string, details?: Record<string, any>) =>
    new APIError('BAD_REQUEST', message, 400, details),

  internal: (message: string = 'Internal server error') =>
    new APIError('INTERNAL_ERROR', message, 500),

  rateLimited: (retryAfter: number) =>
    new APIError('RATE_LIMITED', 'Rate limit exceeded', 429, { retryAfter }),

  webhookFailed: (message: string) =>
    new APIError('WEBHOOK_FAILED', message, 502),
};