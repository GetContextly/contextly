import { createJsonResponse } from './api_request_utils';
import { isValidMcpToken } from './api_token_utils';

export const withMcpAuth = (handler: Function) => {
  return async (req: Request) => {
    const mcpToken = req.headers.get('X-MCP-Token');
    if (!mcpToken || !isValidMcpToken(mcpToken)) {
      return createJsonResponse({ error: 'Invalid or missing MCP token' }, 401);
    }
    return handler(req);
  };
};
