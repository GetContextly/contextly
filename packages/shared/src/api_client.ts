export interface APIClientOptions {
  baseUrl: string;
  authToken?: string;
}

export const createHeaders = (authToken?: string) => {
  const headers = new Headers({
    'Content-Type': 'application/json',
  });
  if (authToken) {
    headers.append('Authorization', `Bearer ${authToken}`);
  }
  return headers;
};
