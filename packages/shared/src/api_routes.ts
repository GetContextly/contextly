export const API_ROUTES = {
  PROJECTS: {
    LIST: '/api/projects',
    CREATE: '/api/projects',
    DETAIL: (id: string) => `/api/projects/${id}`,
    MEMBERS: (id: string) => `/api/projects/${id}/members`,
  },
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    SESSION: '/api/auth/session',
  },
  MCP: {
    VALIDATE_TOKEN: '/api/mcp/validate',
  }
};
