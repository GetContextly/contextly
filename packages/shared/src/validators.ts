export const isUuid = (str: string) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

export const isDateString = (str: string) => {
  return !isNaN(Date.parse(str));
};
