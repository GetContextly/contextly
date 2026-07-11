import fs from 'fs';
import path from 'path';
import os from 'os';
import { ensureDir } from './utils';

const GLOBAL_CONFIG_DIR = path.join(os.homedir(), '.contextly');
const GLOBAL_CONFIG_FILE = path.join(GLOBAL_CONFIG_DIR, 'config.json');

export interface GlobalConfig {
  apiUrl: string;
  logLevel: 'info' | 'debug' | 'silent';
  theme: 'dark' | 'light' | 'system';
}

const DEFAULT_CONFIG: GlobalConfig = {
  apiUrl: 'https://api.getcontextly.dev',
  logLevel: 'info',
  theme: 'dark'
};

export const getGlobalConfig = (): GlobalConfig => {
  if (!fs.existsSync(GLOBAL_CONFIG_FILE)) {
    return DEFAULT_CONFIG;
  }
  try {
    const content = fs.readFileSync(GLOBAL_CONFIG_FILE, 'utf-8');
    return { ...DEFAULT_CONFIG, ...JSON.parse(content) };
  } catch {
    return DEFAULT_CONFIG;
  }
};

export const setGlobalConfig = (updates: Partial<GlobalConfig>) => {
  ensureDir(GLOBAL_CONFIG_DIR);
  const current = getGlobalConfig();
  const next = { ...current, ...updates };
  fs.writeFileSync(GLOBAL_CONFIG_FILE, JSON.stringify(next, null, 2));
  return next;
};
