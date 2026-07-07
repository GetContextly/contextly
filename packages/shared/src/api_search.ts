export interface SearchParams {
  query?: string;
  tags?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult<T> {
  results: T[];
  totalResults: number;
}
