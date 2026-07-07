export const getBearerToken = (authHeader?: string | null) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.split(' ')[1];
};

export const isValidMcpToken = (token: string) => {
  return /^ctx_[a-z0-9]{16}$/.test(token);
};
