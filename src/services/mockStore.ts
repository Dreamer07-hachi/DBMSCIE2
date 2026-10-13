import type { Entity, Filters, ListParams, PaginatedResponse, ResourceService } from "@/types/common";
import { HttpError, mockDelay } from "./apiClient";

export interface MockCollection<T extends Entity> extends ResourceService<T> {
  /** Synchronous access to the in-memory rows (for use inside mock services only). */
  rows(): T[];
  set(id: string, patch: Partial<T>): T;
  insert(input: Omit<T, "id"> & { id?: string }): T;
}

function matchesFilters<T>(item: T, filters: Filters = {}): boolean {
  return Object.entries(filters).every(([rawKey, value]) => {
    if (value === undefined || value === "" || value === "all") return true;
    const rec = item as Record<string, unknown>;
    if (rawKey.endsWith(">=") || rawKey.endsWith("<=")) {
      const key = rawKey.slice(0, -2);
      const v = rec[key];
      const a = typeof v === "number" ? v : String(v ?? "");
      const b = typeof v === "number" ? Number(value) : value;
      return rawKey.endsWith(">=") ? a >= b : a <= b;
    }
    return String(rec[rawKey] ?? "") === value;
  });
}

function matchesSearch<T>(item: T, search: string | undefined, keys: (keyof T)[]): boolean {
  if (!search) return true;
  const s = search.toLowerCase().trim();
  return keys.some((k) => String(item[k] ?? "").toLowerCase().includes(s));
}

export function applyListParams<T>(
  rows: T[],
  params: ListParams = {},
  searchKeys: (keyof T)[],
): PaginatedResponse<T> {
  let out = rows.filter((r) => matchesFilters(r, params.filters) && matchesSearch(r, params.search, searchKeys));
  if (params.sort) {
    const { key, dir } = params.sort;
    out = [...out].sort((a, b) => {
      const av = (a as Record<string, unknown>)[key];
      const bv = (b as Record<string, unknown>)[key];
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av ?? "").localeCompare(String(bv ?? ""), "en", { numeric: true });
      return dir === "asc" ? cmp : -cmp;
    });
  }
  const pageSize = params.pageSize ?? 10;
  const total = out.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, params.page ?? 1), totalPages);
  return { data: out.slice((page - 1) * pageSize, page * pageSize), total, page, pageSize, totalPages };
}

/**
 * In-memory CRUD collection with simulated latency. Seeds lazily on first
 * access and persists for the browser session (until reload).
 */
export function createMockCollection<T extends Entity>(
  seed: () => T[],
  opts: { searchKeys: (keyof T)[]; idPrefix: string },
): MockCollection<T> {
  let store: T[] | null = null;
  let counter = 0;
  const db = () => {
    if (!store) {
      store = seed();
      counter = store.length;
    }
    return store;
  };
  const clone = <V>(v: V): V => JSON.parse(JSON.stringify(v)) as V;
  const nextId = () => {
    counter += 1;
    let id = `${opts.idPrefix}${String(counter + 100).padStart(4, "0")}`;
    while (db().some((r) => r.id === id)) {
      counter += 1;
      id = `${opts.idPrefix}${String(counter + 100).padStart(4, "0")}`;
    }
    return id;
  };
  const set = (id: string, patch: Partial<T>): T => {
    const list = db();
    const idx = list.findIndex((r) => r.id === id);
    if (idx < 0) throw new HttpError("Record not found", 404);
    const updated = { ...list[idx], ...patch, id } as T;
    list[idx] = updated;
    return updated;
  };
  const insert = (input: Omit<T, "id"> & { id?: string }) => {
    const row = { ...input, id: input.id ?? nextId() } as T;
    db().unshift(row);
    return row;
  };

  return {
    rows: db,
    set,
    insert,
    async list(params) {
      await mockDelay();
      return clone(applyListParams(db(), params, opts.searchKeys));
    },
    async all(params) {
      await mockDelay();
      return clone(db().filter((r) => matchesFilters(r, params?.filters) && matchesSearch(r, params?.search, opts.searchKeys)));
    },
    async get(id) {
      await mockDelay();
      const row = db().find((r) => r.id === id);
      if (!row) throw new HttpError("Record not found", 404);
      return clone(row);
    },
    async create(input) {
      await mockDelay();
      return clone(insert(input));
    },
    async update(id, patch) {
      await mockDelay();
      return clone(set(id, patch));
    },
    async remove(id) {
      await mockDelay();
      const idx = db().findIndex((r) => r.id === id);
      if (idx < 0) throw new HttpError("Record not found", 404);
      db().splice(idx, 1);
    },
  };
}
