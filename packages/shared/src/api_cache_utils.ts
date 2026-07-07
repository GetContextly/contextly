import { CacheEntry } from './api_cache_types';

const cache = new Map<string, CacheEntry<any>>();

export const getCache = <T>(key: string, ttl: number): T | null => {
  const entry = cache.get(key);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > ttl) {
    cache.delete(key);
    return null;
  }
  return entry.data;
};

export const setCache = <T>(key: string, data: T) => {
  cache.set(key, { data, timestamp: Date.now() });
};
