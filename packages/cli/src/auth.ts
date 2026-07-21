import fs from 'fs';
import path from 'path';
import os from 'os';

const AUTH_CONFIG_PATH = path.join(os.homedir(), '.contextly_auth');

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';

export interface AuthSession {
  accessToken: string;
  user: {
    id: string;
    email?: string;
    login?: string;
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

export async function initiateDeviceFlow() {
  if (!GITHUB_CLIENT_ID) {
    throw new Error(
      'GITHUB_CLIENT_ID not set.\n' +
      '  Set it in your environment: export GITHUB_CLIENT_ID=your_client_id\n' +
      '  Or add it to a .env file in your project root.'
    );
  }
  const response = await fetch('https://github.com/login/device/code', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      scope: 'repo user'
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to initiate device flow: ${response.statusText}`);
  }

  return response.json();
}

export async function pollForToken(deviceCode: string, interval: number) {
  const startTime = Date.now();
  // 15 minutes timeout
  const timeout = 15 * 60 * 1000;

  while (Date.now() - startTime < timeout) {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        device_code: deviceCode,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
      })
    });

    const data: any = await response.json();

    if (data.access_token) {
      return data.access_token;
    }

    if (data.error === 'authorization_pending') {
      await new Promise(resolve => setTimeout(resolve, interval * 1000));
      continue;
    }

    if (data.error === 'slow_down') {
      interval += 5;
      await new Promise(resolve => setTimeout(resolve, interval * 1000));
      continue;
    }

    throw new Error(`Auth failed: ${data.error_description || data.error}`);
  }

  throw new Error('Authentication timed out');
}

export async function getGitHubUser(token: string) {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch GitHub user');
  }

  return response.json();
}
