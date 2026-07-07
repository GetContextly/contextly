import fs from 'fs';
import path from 'path';
import os from 'os';

const AUTH_CONFIG_PATH = path.join(os.homedir(), '.contextly_auth');

export interface AuthSession {
  accessToken: string;
  user: {
    id: string;
    email?: string;
  };
}

export const saveSession = (session: AuthSession) => {
  fs.writeFileSync(AUTH_CONFIG_PATH, JSON.stringify(session, null, 2));
};

export const getSession = (): AuthSession | null => {
  if (!fs.existsSync(AUTH_CONFIG_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(AUTH_CONFIG_PATH, 'utf-8'));
  } catch {
    return null;
  }
};

export const clearSession = () => {
  if (fs.existsSync(AUTH_CONFIG_PATH)) {
    fs.unlinkSync(AUTH_CONFIG_PATH);
  }
};
