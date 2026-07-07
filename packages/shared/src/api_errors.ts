export interface APIErrorInfo {
  status: number;
  message: string;
  code?: string;
}

export const API_ERRORS: Record<string, APIErrorInfo> = {
  UNAUTHORIZED: { status: 401, message: 'Unauthorized', code: 'UNAUTHORIZED' },
  FORBIDDEN: { status: 403, message: 'Forbidden', code: 'FORBIDDEN' },
  NOT_FOUND: { status: 404, message: 'Resource not found', code: 'NOT_FOUND' },
  INTERNAL_ERROR: { status: 500, message: 'Internal server error', code: 'INTERNAL_ERROR' },
};
