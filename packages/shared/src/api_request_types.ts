export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | undefined>;
  timeout?: number;
  retries?: number;
}
