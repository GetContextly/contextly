export const isAuthError = (error: any) => {
  return error?.code === 'UNAUTHORIZED' || error?.status === 401;
};

export const getErrorMessage = (error: any, fallback: string = 'Something went wrong') => {
  return error?.message || error?.error?.message || fallback;
};
