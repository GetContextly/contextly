export class ContextlyError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'ContextlyError';
  }
}

export class AuthError extends ContextlyError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTH_FAILED');
    this.name = 'AuthError';
  }
}

export class ProjectNotFoundError extends ContextlyError {
  constructor(projectId: string) {
    super(`Project not found: ${projectId}`, 'PROJECT_NOT_FOUND');
    this.name = 'ProjectNotFoundError';
  }
}
