export const safeJsonParse = <T>(json: string): T | null => {
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
};

export const safeJsonStringify = (data: any): string => {
  try {
    return JSON.stringify(data);
  } catch {
    return '';
  }
};
