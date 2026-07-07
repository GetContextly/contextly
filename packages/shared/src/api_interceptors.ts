export type Interceptor = (options: RequestInit) => RequestInit | Promise<RequestInit>;

export const applyInterceptors = async (options: RequestInit, interceptors: Interceptor[]) => {
  let finalOptions = { ...options };
  for (const interceptor of interceptors) {
    finalOptions = await interceptor(finalOptions);
  }
  return finalOptions;
};
