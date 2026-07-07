export const parseBody = async <T>(req: Request): Promise<T | null> => {
  try {
    return await req.json() as T;
  } catch {
    return null;
  }
};

export const createJsonResponse = (data: any, status: number = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
};
