export const createMcpResponse = (text: string) => {
  return {
    content: [{ type: 'text', text }],
  };
};

export const createMcpError = (message: string) => {
  return {
    content: [{ type: 'text', text: `Error: ${message}` }],
    isError: true,
  };
};
