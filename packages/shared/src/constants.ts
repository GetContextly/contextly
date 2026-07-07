export const ROLES: Record<string, string> = {
  OWNER: 'owner',
  MEMBER: 'member',
  VIEWER: 'viewer',
};

export const SOURCES = {
  GIT_COMMIT: 'git_commit',
  PULL_REQUEST: 'pull_request',
  AGENT_LOGGED: 'agent_logged',
  MANUAL: 'manual',
} as const;
