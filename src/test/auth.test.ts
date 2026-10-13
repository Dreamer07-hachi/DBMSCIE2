import { describe, expect, it } from "vitest";
import { can, PERMISSIONS } from "@/config/permissions";
import { DEMO_USERS } from "@/services/authService";

describe("Authentication & Role Permissions", () => {
  it("defines all key roles with appropriate demo users", () => {
    const roles = DEMO_USERS.map((u) => u.role);
    expect(roles).toContain("super_admin");
    expect(roles).toContain("faculty");
    expect(roles).toContain("student");
  });

  it("enforces role-based permissions correctly", () => {
    // Super admin has full access
    expect(can("super_admin", "student-admission", "create")).toBe(true);
    expect(can("super_admin", "finance", "approve")).toBe(true);

    // Student has read-only academic and cannot manage admissions
    expect(can("student", "academic", "view")).toBe(true);
    expect(can("student", "student-admission", "view")).toBe(false);
    expect(can("student", "student-admission", "create")).toBe(false);

    // Faculty can view academic and grade attendance/exams
    expect(can("faculty", "academic", "view")).toBe(true);
    expect(can("faculty", "academic", "create")).toBe(false);
    expect(can("faculty", "attendance-examination", "create")).toBe(true);
  });
});
