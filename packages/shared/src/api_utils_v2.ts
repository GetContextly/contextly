import { createJsonResponse } from './api_request_utils';
import { corsHeaders } from './api_cors_utils';

export const withCors = (handler: Function) => {
  return async (req: Request) => {
    const response = await handler(req);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  };
};

export const handleApiMethod = (handlers: Record<string, Function>) => {
  return async (req: Request) => {
    const handler = handlers[req.method];
    if (!handler) {
      return createJsonResponse({ error: 'Method not allowed' }, 405);
    }
    return handler(req);
  };
};
