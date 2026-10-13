export type SortDir = "asc" | "desc";

/**
 * Filters use plain field equality. Two range suffixes are supported:
 *   "field>=" and "field<=" (numbers or ISO date strings).
 * Empty string / "all" / undefined means "no filter".
 */
export type Filters = Record<string, string | undefined>;

export interface ListParams {
  search?: string | undefined;
  filters?: Filters | undefined;
  sort?: { key: string; dir: SortDir } | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  status?: number | undefined;
  code?: string | undefined;
}

export interface Entity {
  id: string;
}

/** Generic CRUD contract implemented by both mock and REST adapters. */
export interface ResourceService<T extends Entity> {
  list(params?: ListParams): Promise<PaginatedResponse<T>>;
  all(params?: Pick<ListParams, "filters" | "search">): Promise<T[]>;
  get(id: string): Promise<T>;
  create(input: Omit<T, "id">): Promise<T>;
  update(id: string, patch: Partial<T>): Promise<T>;
  remove(id: string): Promise<void>;
}

export interface Option {
  label: string;
  value: string;
}

export interface ChartDatum {
  [key: string]: string | number;
}
