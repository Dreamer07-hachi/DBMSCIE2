import { apiConfig } from "@/config/api";
import type { Role } from "@/config/permissions";
import { apiClient, HttpError, mockDelay } from "./apiClient";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** Linked student record for the Student role. */
  studentId?: string;
  facultyId?: string;
  department?: string;
}

export interface Session {
  user: SessionUser;
  token: string;
}

export interface AuthService {
  login(identifier: string, password: string, remember: boolean): Promise<Session>;
  loginAs(role: Role): Promise<Session>;
  logout(): Promise<void>;
  getSession(): Session | null;
  validateSession(): Promise<Session | null>;
  subscribe(cb: () => void): () => void;
  requestPasswordReset(email: string): Promise<void>;
  register(name: string, email: string, password: string, role: Role): Promise<void>;
}

const KEY = "pict-erp-session";
export const DEMO_PASSWORD = "demo123";

export const DEMO_USERS: SessionUser[] = [
  { id: "U001", name: "Dr. Anil Bhandari", email: "admin@pict.edu", role: "super_admin", department: "Administration" },
  { id: "U002", name: "Mrs. Shalini Kapoor", email: "admissions@pict.edu", role: "admission_officer", department: "Admissions" },
  { id: "U003", name: "Dr. Manish Verma", email: "academic@pict.edu", role: "academic_admin", department: "Academics" },
  { id: "U004", name: "Prof. Meera Deshpande", email: "faculty@pict.edu", role: "faculty", facultyId: "FAC002", department: "Computer Engineering" },
  { id: "U005", name: "Mr. Ganesh Pillai", email: "hr@pict.edu", role: "hr_admin", department: "HR" },
  { id: "U006", name: "Mrs. Lata Kulkarni", email: "accounts@pict.edu", role: "accounts_officer", department: "Accounts" },
  { id: "U007", name: "Mr. Dinesh Yadav", email: "hostel@pict.edu", role: "hostel_admin", department: "Hostel" },
  { id: "U008", name: "Mrs. Rekha Sawant", email: "library@pict.edu", role: "librarian", department: "Library" },
  { id: "U009", name: "Aarav Kulkarni", email: "aarav.kulkarni@pict.edu", role: "student", studentId: "STU2023001", department: "Computer Engineering" },
];

const listeners = new Set<() => void>();
let cached: Session | null | undefined;

/** In-memory mock user store for registrations during the session. */
const mockRegistered = new Map<string, { user: SessionUser; password: string }>();

function read(): Session | null {
  if (typeof window === "undefined") return null;
  if (cached !== undefined) return cached;
  const raw = localStorage.getItem(KEY) ?? sessionStorage.getItem(KEY);
  try {
    cached = raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    cached = null;
  }
  return cached;
}

function persist(session: Session | null, remember = true) {
  if (typeof window !== "undefined") {
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(KEY);
    if (session) (remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(session));
  }
  cached = session;
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  window.addEventListener("pict:session-expired", () => {
    persist(null);
  });
}

/* ─────────────────────── Mock service (no backend required) ── */
const mockAuthService: AuthService = {
  async login(identifier, password, remember) {
    await mockDelay();
    const id = identifier.trim().toLowerCase();

    // Check registered-in-session users first
    const regEntry = mockRegistered.get(id);
    if (regEntry && regEntry.password === password) {
      const session: Session = { user: regEntry.user, token: `mock-${regEntry.user.id}` };
      persist(session, remember);
      return session;
    }

    // Check seeded demo users
    const user = DEMO_USERS.find(
      (u) =>
        u.email.toLowerCase() === id ||
        u.email.split("@")[0].toLowerCase() === id ||
        u.studentId?.toLowerCase() === id
    );

    const validPasswords = [DEMO_PASSWORD, "pict@Student2026", "pict@Admin2026", "pict@Faculty2026"];
    if (!user || !validPasswords.includes(password)) {
      throw new HttpError("Invalid email or password. Please try again.", 401);
    }

    const session: Session = { user, token: `mock-${user.id}` };
    persist(session, remember);
    return session;
  },

  async loginAs(role) {
    const user = DEMO_USERS.find((u) => u.role === role) ?? DEMO_USERS[0]!;
    const session: Session = { user, token: `mock-${user.id}` };
    persist(session, true);
    return session;
  },

  async logout() {
    persist(null);
  },

  getSession: read,

  async validateSession() {
    return read();
  },

  subscribe(cb) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },

  async requestPasswordReset(_email) {
    await mockDelay();
    // Simulate email dispatch in mock mode
  },

  async register(name, email, password, role) {
    await mockDelay();
    const key = email.trim().toLowerCase();

    // Check for duplicates in demo users
    const existing = DEMO_USERS.find((u) => u.email.toLowerCase() === key);
    if (existing || mockRegistered.has(key)) {
      throw new HttpError(
        "An account with this email already exists. Please log in instead.",
        409
      );
    }

    // Admin role cannot be registered publicly
    if (role === "super_admin") {
      throw new HttpError(
        "Administrator accounts cannot be created through public registration.",
        403
      );
    }

    const newUser: SessionUser = {
      id: `U-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      department: role === "student" ? "Computer Engineering" : "Computer Engineering",
    };

    mockRegistered.set(key, { user: newUser, password });
  },
};

/* ─────────────────────── REST service (real backend) ── */
const restAuthService: AuthService = {
  ...mockAuthService,

  async login(identifier, password, remember) {
    try {
      const res = await apiClient.post<Session>(`${apiConfig.auth.baseUrl}/login`, {
        identifier,
        password,
        remember,
      });
      persist(res, remember);
      return res;
    } catch (err) {
      if (err instanceof HttpError) {
        // Re-map generic request-failed messages to user-friendly text
        if (err.status === 401 || err.status === 400) {
          throw new HttpError("Invalid email or password. Please try again.", err.status);
        }
        throw err;
      }
      throw new HttpError(
        "Could not reach the authentication server. Please check your connection or try again later.",
        503
      );
    }
  },

  async loginAs(role) {
    const user = DEMO_USERS.find((u) => u.role === role) ?? DEMO_USERS[0]!;
    return this.login(user.email, DEMO_PASSWORD, true);
  },

  async logout() {
    try {
      await apiClient.post(`${apiConfig.auth.baseUrl}/logout`);
    } catch {
      // Ignore network errors on logout
    }
    persist(null);
  },

  async validateSession() {
    const current = read();
    if (!current) return null;
    try {
      const res = await apiClient.get<{ user: SessionUser }>(`${apiConfig.auth.baseUrl}/me`);
      if (res?.user) {
        const updated: Session = { ...current, user: res.user };
        persist(updated);
        return updated;
      }
      return current;
    } catch {
      persist(null);
      return null;
    }
  },

  async requestPasswordReset(email) {
    await apiClient.post(`${apiConfig.auth.baseUrl}/forgot-password`, { email });
  },

  async register(name, email, password, role) {
    try {
      await apiClient.post(`${apiConfig.auth.baseUrl}/register`, {
        name,
        email,
        password,
        role,
      });
    } catch (err) {
      if (err instanceof HttpError) {
        if (err.status === 409) {
          throw new HttpError(
            "An account with this email already exists. Please log in instead.",
            409
          );
        }
        throw err;
      }
      throw new HttpError(
        "Could not reach the server. Please try again later.",
        503
      );
    }
  },
};

export const authService: AuthService = apiConfig.auth.useMock ? mockAuthService : restAuthService;
