export const API_ENDPOINTS = {
  PROJECTS: '/api/projects',
  AUTH: '/api/auth',
  DECISIONS: '/api/decisions',
  CHANGES: '/api/changes',
};

export const getProjectDetailEndpoint = (id: string) => `/api/projects/${id}`;
