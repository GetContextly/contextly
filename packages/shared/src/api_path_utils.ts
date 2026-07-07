export const joinPaths = (...parts: string[]) => {
  return parts
    .map(p => p.replace(/(^\/|\/$)/g, ''))
    .filter(p => p !== '')
    .join('/');
};

export const buildUrl = (baseUrl: string, path: string) => {
  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
};
