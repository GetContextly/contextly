export const CONTENT_TYPE_JSON = { 'Content-Type': 'application/json' };

export const authHeader = (token: string) => ({
  'Authorization': `Bearer ${token}`
});

export const mcpTokenHeader = (token: string) => ({
  'X-MCP-Token': token
});
