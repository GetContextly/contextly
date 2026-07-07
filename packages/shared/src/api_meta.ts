export interface APIMeta {
  totalCount: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: APIMeta;
}
