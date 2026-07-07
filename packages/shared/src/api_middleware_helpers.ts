import { createJsonResponse } from './api_request_utils';

export const withAuth = (handler: Function) => {
  return async (req: Request) => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createJsonResponse({ error: 'Missing authorization header' }, 401);
    }
    return handler(req);
  };
};
