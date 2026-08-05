export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiQueryParams {
  page?: number;
  limit?: number;
  [key: string]: string | number | undefined;
}
