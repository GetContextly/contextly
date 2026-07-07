import { APIResponse } from './api_types';
import { RequestOptions } from './api_request_types';
import { getQueryParams } from './request_utils';
import { buildUrl } from './api_path_utils';

export abstract class APIBaseClient {
  constructor(protected readonly baseUrl: string, protected readonly authToken?: string) {}

  protected async request<T>(path: string, options: RequestOptions = {}): Promise<APIResponse<T>> {
    const url = buildUrl(this.baseUrl, path) + getQueryParams(options.params || {});
    const response = await fetch(url, options);
    return response.json();
  }
}
