export const generateShortId = () => {
  return Math.random().toString(36).substring(2, 10);
};

export const generateMcpToken = () => {
  return `ctx_${generateShortId()}${generateShortId()}`;
};
