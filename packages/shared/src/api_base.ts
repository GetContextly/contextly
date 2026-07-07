export abstract class APIBase {
  protected constructor(protected readonly baseUrl: string) {}

  protected async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, options);
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }
    return response.json() as Promise<T>;
  }
}
