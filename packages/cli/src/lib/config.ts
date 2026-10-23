import fs from 'fs';
import path from 'path';
import os from 'os';

export const GLOBAL_CONFIG_DIR = path.join(os.homedir(), '.contextly');
export const GLOBAL_CONFIG_FILE = path.join(GLOBAL_CONFIG_DIR, 'config.json');
export const AUTH_CONFIG_FILE = path.join(os.homedir(), '.contextly_auth');

export interface GlobalConfig {
  apiUrl: string;
  logLevel: 'info' | 'debug' | 'silent';
  theme: 'dark' | 'light' | 'system';
}

export const DEFAULT_CONFIG: GlobalConfig = {
  apiUrl: 'https://api.getcontextly.dev',
  logLevel: 'info',
  theme: 'dark'
};

export const getGlobalConfig = (): GlobalConfig => {
  if (!fs.existsSync(GLOBAL_CONFIG_FILE)) return DEFAULT_CONFIG;
  try {
    return { ...DEFAULT_CONFIG, ...JSON.parse(fs.readFileSync(GLOBAL_CONFIG_FILE, 'utf-8')) };
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

export interface ProjectConfig {
  projectId: string;
  name: string;
  scope?: string;
}

export interface MCPConfig {
  mcpToken: string;
  projectId: string;
}

export const getProjectConfig = (cwd: string = process.cwd()): ProjectConfig | null => {
  const configPath = path.join(cwd, '.contextly', 'config.json');
  if (!fs.existsSync(configPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch {
    return null;
  }
};

export const getMCPConfig = (cwd: string = process.cwd()): MCPConfig | null => {
  const configPath = path.join(cwd, '.contextly', 'mcp.json');
  if (!fs.existsSync(configPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch {
    return null;
  }
};

export interface AuthSession {
  accessToken: string;
  user: { id: string; email?: string; login?: string };
}

export const getAuthSession = (): AuthSession | null => {
  if (!fs.existsSync(AUTH_CONFIG_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(AUTH_CONFIG_FILE, 'utf-8'));
  } catch {
    return null;
  }
};

export const saveAuthSession = (session: AuthSession) => {
  ensureDir(path.dirname(AUTH_CONFIG_FILE));
  fs.writeFileSync(AUTH_CONFIG_FILE, JSON.stringify(session, null, 2));
};

export const clearAuthSession = () => {
  if (fs.existsSync(AUTH_CONFIG_FILE)) fs.unlinkSync(AUTH_CONFIG_FILE);
};

export const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

export const writeJson = (file: string, data: unknown) => {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

export const readJson = <T>(file: string): T | null => {
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return null;
  }
};

export const formatTimestamp = (ts: string) => new Date(ts).toLocaleString();
export const formatDate = (ts: string) => new Date(ts).toLocaleDateString();