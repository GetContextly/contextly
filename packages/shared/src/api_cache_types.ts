export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export interface CacheConfig {
  ttl: number; // Time to live in ms
}
