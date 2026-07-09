import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = process.env.SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

export const getSupabase = (key?: string) => {
  const url = SUPABASE_URL;
  const k = key || SUPABASE_ANON_KEY;
  if (!url || !k) {
    throw new Error('Missing Supabase credentials. Ensure SUPABASE_URL and SUPABASE_ANON_KEY are set in your environment.');
  }
  return createClient(url, k);
};

export const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

export const writeJson = (filePath: string, data: any) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

export const readJson = <T>(filePath: string): T | null => {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
};
