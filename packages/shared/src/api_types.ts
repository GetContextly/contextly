export interface APIResponse<T> {
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

export interface ProjectListResponse {
  projects: Array<{
    id: string;
    name: string;
    role: string;
  }>;
}
