export const isValidProjectName = (name: string) => {
  return name.length >= 3 && name.length <= 50 && /^[a-zA-Z0-9-_ ]+$/.test(name);
};

export const slugify = (name: string) => {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
};
