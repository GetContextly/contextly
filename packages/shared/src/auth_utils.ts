export const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const maskToken = (token: string) => {
  if (token.length < 8) return '********';
  return token.substring(0, 4) + '...' + token.substring(token.length - 4);
};
