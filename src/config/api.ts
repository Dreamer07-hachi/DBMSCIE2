/**
 * API configuration — one entry per backend resource group.
 *
 * To switch a module from mock data to a real REST API:
 *   1. Set VITE_API_BASE_URL (e.g. https://erp.pict.edu) in your env.
 *   2. Flip `useMock` to false for that module below.
 * The module's service.ts picks the REST implementation automatically.
 */
export interface ModuleApiConfig {
  baseUrl: string;
  useMock: boolean;
}

export const API_BASE_URL: string =
  (import.meta.env["VITE_API_BASE_URL"] as string | undefined) ?? "";

const useMockAuth = import.meta.env["VITE_USE_MOCK_AUTH"] === "true";
const useMockDashboard = import.meta.env["VITE_USE_MOCK_DASHBOARD"] === "true";

export const apiConfig = {
  auth: { baseUrl: "/api/auth", useMock: useMockAuth },
  dashboard: { baseUrl: "/api/dashboard", useMock: useMockDashboard },
  search: { baseUrl: "/api/search", useMock: true },
  notifications: { baseUrl: "/api/notifications", useMock: true },
  students: { baseUrl: "/api/students", useMock: true },
  admissions: { baseUrl: "/api/admissions", useMock: true },
  academic: { baseUrl: "/api/academic", useMock: true },
  attendance: { baseUrl: "/api/attendance", useMock: true },
  examination: { baseUrl: "/api/examination", useMock: true },
  faculty: { baseUrl: "/api/faculty", useMock: true },
  hr: { baseUrl: "/api/hr", useMock: true },
  finance: { baseUrl: "/api/finance", useMock: true },
  hostel: { baseUrl: "/api/hostel", useMock: true },
  library: { baseUrl: "/api/library", useMock: true },
  studentServices: { baseUrl: "/api/student-services", useMock: true },
} satisfies Record<string, ModuleApiConfig>;

export type ApiModule = keyof typeof apiConfig;

/** Simulated network latency for mock services (ms). */
export const MOCK_LATENCY = { min: 400, max: 800 };
