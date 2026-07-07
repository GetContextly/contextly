import { APIResponse } from './api_types';

export const wrapResponse = <T>(data: T): APIResponse<T> => {
  return { data };
};

export const wrapError = (message: string, code?: string): APIResponse<never> => {
  return { error: { message, code } };
};
