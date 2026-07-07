export const DEFAULT_CONFIG_FILENAME = 'config.json';
export const CONTEXTLY_DIR = '.contextly';

export const getRelativeConfigPath = () => {
  return `${CONTEXTLY_DIR}/${DEFAULT_CONFIG_FILENAME}`;
};
