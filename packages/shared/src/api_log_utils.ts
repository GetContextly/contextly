export const logRequest = (req: Request) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
};

export const logResponse = (res: Response) => {
  console.log(`[${new Date().toISOString()}] Response: ${res.status}`);
};
