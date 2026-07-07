export const isBrowser = typeof window !== 'undefined';
export const isServer = !isBrowser;

export const getEnv = (key: string, defaultValue?: string): string => {
  const value = isBrowser ? undefined : process.env[key];
  return value || defaultValue || '';
};
