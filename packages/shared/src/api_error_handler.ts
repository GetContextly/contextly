import { API_ERRORS, APIErrorInfo } from './api_errors';

export const handleApiError = (status: number): APIErrorInfo => {
  switch (status) {
    case 401: return API_ERRORS.UNAUTHORIZED;
    case 403: return API_ERRORS.FORBIDDEN;
    case 404: return API_ERRORS.NOT_FOUND;
    default: return API_ERRORS.INTERNAL_ERROR;
  }
};
