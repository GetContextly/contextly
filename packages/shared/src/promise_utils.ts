export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const timeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
  ]);
};
