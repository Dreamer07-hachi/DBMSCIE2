import { API_BASE_URL, MOCK_LATENCY } from "@/config/api";
import type { ApiError, Entity, ListParams, PaginatedResponse, ResourceService } from "@/types/common";

export class HttpError extends Error implements ApiError {
  status?: number;
  code?: string;
  constructor(message: string, status?: number, code?: string) {
    super(message);
    if (status !== undefined) this.status = status;
    if (code !== undefined) this.code = code;
  }
}

const SESSION_KEY = "pict-erp-session";

function authHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(SESSION_KEY) ?? sessionStorage.getItem(SESSION_KEY);
  if (!raw) return {};
  try {
    const token = (JSON.parse(raw) as { token?: string }).token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...authHeader(), ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as Partial<ApiError>;
      if (body.message) message = body.message;
    } catch {
      /* non-JSON error body */
    }
    // Dispatch session-expired event on 401 when not on the login page
    if (res.status === 401 && typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
      window.dispatchEvent(new CustomEvent("pict:session-expired"));
    }
    throw new HttpError(message, res.status);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body ?? {}) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body ?? {}) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

/** Serialises ListParams to ?search=&page=&pageSize=&sort=key:dir&filter[key]=value */
export function toQuery(params: ListParams = {}): string {
  const q = new URLSearchParams();
  if (params.search) q.set("search", params.search);
  if (params.page) q.set("page", String(params.page));
  if (params.pageSize) q.set("pageSize", String(params.pageSize));
  if (params.sort) q.set("sort", `${params.sort.key}:${params.sort.dir}`);
  Object.entries(params.filters ?? {}).forEach(([k, v]) => {
    if (v && v !== "all") q.set(`filter[${k}]`, v);
  });
  const s = q.toString();
  return s ? `?${s}` : "";
}

/** Standard REST adapter: GET list, GET :id, POST, PATCH :id, DELETE :id */
export function createRestResource<T extends Entity>(path: string): ResourceService<T> {
  return {
    list: (params) => apiClient.get<PaginatedResponse<T>>(`${path}${toQuery(params)}`),
    all: async (params) =>
      (await apiClient.get<PaginatedResponse<T>>(`${path}${toQuery({ ...params, pageSize: 1000 })}`)).data,
    get: (id) => apiClient.get<T>(`${path}/${id}`),
    create: (input) => apiClient.post<T>(path, input),
    update: (id, patch) => apiClient.patch<T>(`${path}/${id}`, patch),
    remove: (id) => apiClient.delete<void>(`${path}/${id}`),
  };
}

/** True when the current URL contains ?simulateError — lets you test error states. */
export function shouldSimulateError(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).has("simulateError");
}

/** Simulated latency (400–800ms) + optional forced error for mock services. */
export async function mockDelay(): Promise<void> {
  const ms = MOCK_LATENCY.min + Math.random() * (MOCK_LATENCY.max - MOCK_LATENCY.min);
  await new Promise((r) => setTimeout(r, ms));
  if (shouldSimulateError()) {
    throw new HttpError("Simulated server error (remove ?simulateError from the URL)", 500, "SIMULATED");
  }
}

export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err && "message" in err) return String((err as ApiError).message);
  return "Something went wrong";
}
