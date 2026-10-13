import type { LinkProps } from "@tanstack/react-router";
import {
  BookOpen,
  Building2,
  CalendarCheck,
  GraduationCap,
  IndianRupee,
  LayoutDashboard,
  Library,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { ModuleKey } from "./permissions";

export type AppPath = NonNullable<LinkProps["to"]> | (string & {});

export interface SubNavTab {
  label: string;
  to: AppPath;
  exact?: boolean;
}

export interface ModuleDef {
  key: ModuleKey;
  label: string;
  description: string;
  icon: LucideIcon;
  to: AppPath;
  /** URL prefixes owned by this module (used by the access guard + active state). */
  paths: string[];
  tabs: SubNavTab[];
}

export const MODULES: ModuleDef[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    description: "College-wide overview",
    icon: LayoutDashboard,
    to: "/dashboard",
    paths: ["/dashboard"],
    tabs: [],
  },
  {
    key: "student-admission",
    label: "Student & Admission",
    description: "Student records, profiles and admission applications.",
    icon: GraduationCap,
    to: "/students",
    paths: ["/students", "/admissions"],
    tabs: [
      { label: "Students", to: "/students" },
      { label: "Admissions", to: "/admissions" },
    ],
  },
  {
    key: "academic",
    label: "Academic & Courses",
    description: "Departments, courses, curriculum and timetables.",
    icon: BookOpen,
    to: "/academic",
    paths: ["/academic"],
    tabs: [
      { label: "Overview", to: "/academic", exact: true },
      { label: "Departments", to: "/academic/departments" },
      { label: "Courses", to: "/academic/courses" },
      { label: "Curriculum", to: "/academic/curriculum" },
      { label: "Timetable", to: "/academic/timetable" },
    ],
  },
  {
    key: "attendance-examination",
    label: "Attendance & Examination",
    description: "Attendance tracking, exam schedules, marks and results.",
    icon: CalendarCheck,
    to: "/attendance",
    paths: ["/attendance", "/examinations"],
    tabs: [
      { label: "Attendance", to: "/attendance" },
      { label: "Examination", to: "/examinations", exact: true },
      { label: "Results", to: "/examinations/results" },
    ],
  },
  {
    key: "faculty-hr",
    label: "Faculty & HR",
    description: "Faculty profiles, leave, payroll and recruitment.",
    icon: Users,
    to: "/faculty",
    paths: ["/faculty", "/hr"],
    tabs: [
      { label: "Faculty", to: "/faculty" },
      { label: "HR", to: "/hr" },
    ],
  },
  {
    key: "finance",
    label: "Fees & Finance",
    description: "Fee records, structures, payments and receipts.",
    icon: IndianRupee,
    to: "/finance",
    paths: ["/finance"],
    tabs: [
      { label: "Overview", to: "/finance", exact: true },
      { label: "Fees", to: "/finance/fees" },
      { label: "Payments", to: "/finance/payments" },
    ],
  },
  {
    key: "hostel",
    label: "Hostel",
    description: "Rooms, allocations, complaints, mess and visitors.",
    icon: Building2,
    to: "/hostel",
    paths: ["/hostel"],
    tabs: [
      { label: "Overview", to: "/hostel", exact: true },
      { label: "Rooms", to: "/hostel/rooms" },
      { label: "Allocation", to: "/hostel/allocation" },
    ],
  },
  {
    key: "library-services",
    label: "Library & Student Services",
    description: "Books, issue/return, fines and student service requests.",
    icon: Library,
    to: "/library",
    paths: ["/library", "/student-services"],
    tabs: [
      { label: "Overview", to: "/library", exact: true },
      { label: "Books", to: "/library/books" },
      { label: "Issue / Return", to: "/library/issue-return" },
      { label: "Student Services", to: "/student-services" },
    ],
  },
  {
    key: "settings",
    label: "Settings",
    description: "Account and preferences",
    icon: Settings,
    to: "/settings",
    paths: ["/settings"],
    tabs: [],
  },
];

export const FEATURE_MODULES = MODULES.filter((m) => m.key !== "dashboard" && m.key !== "settings");

export function moduleForPath(pathname: string): ModuleDef | undefined {
  return MODULES.find((m) => m.paths.some((p) => pathname === p || pathname.startsWith(`${p}/`)));
}
