import { apiConfig } from "@/config/api";
import type { ChartDatum } from "@/types/common";
import { apiClient, mockDelay } from "./apiClient";
import { addDays, DEPARTMENTS, REF_DATE } from "./mockSeed";

export interface DashboardSummary {
  kpis: {
    totalStudents: number; newAdmissions: number; facultyMembers: number; attendancePct: number;
    pendingFees: number; upcomingExams: number; hostelOccupancyPct: number; booksIssued: number;
  };
  enrollmentTrend: ChartDatum[];
  departmentDistribution: ChartDatum[];
  attendanceOverview: ChartDatum[];
  feeCollection: ChartDatum[];
  examPerformance: ChartDatum[];
  activity: { id: string; type: string; text: string; time: string }[];
  events: { id: string; title: string; date: string; category: "Exam" | "Fee" | "Admission" | "Event" }[];
}

export interface StudentDashboard {
  name: string;
  studentId: string;
  program: string;
  attendancePct: number;
  cgpa: number;
  feesDue: number;
  booksIssued: number;
  hostelRoom: string;
  isDemoMetrics?: boolean;
  attendanceBySubject: ChartDatum[];
  upcoming: { id: string; title: string; date: string; category: string }[];
}

export interface DashboardService {
  getSummary(): Promise<DashboardSummary>;
  getStudentDashboard(studentId: string): Promise<StudentDashboard>;
}

const mockDashboardService: DashboardService = {
  async getSummary() {
    await mockDelay();
    return {
      kpis: { totalStudents: 4218, newAdmissions: 1086, facultyMembers: 236, attendancePct: 82.4, pendingFees: 18450000, upcomingExams: 14, hostelOccupancyPct: 87, booksIssued: 1342 },
      enrollmentTrend: ["2021", "2022", "2023", "2024", "2025", "2026"].map((y, i) => ({ year: y, students: 3420 + i * 160 + (i % 2) * 45 })),
      departmentDistribution: DEPARTMENTS.map((d, i) => ({ department: d.code, students: [1180, 860, 720, 540, 480, 438][i] ?? 0 })),
      attendanceOverview: ["Jun", "Jul", "Aug", "Sep", "Oct"].map((m, i) => ({ month: m, attendance: [78, 84, 81, 85, 82][i] ?? 0 })),
      feeCollection: ["Jun", "Jul", "Aug", "Sep", "Oct"].map((m, i) => ({ month: m, collected: [9200000, 14100000, 6800000, 4300000, 2100000][i] ?? 0, pending: [3200000, 2900000, 2400000, 2050000, 1845000][i] ?? 0 })),
      examPerformance: ["O", "A+", "A", "B+", "B", "C", "F"].map((g, i) => ({ grade: g, students: [210, 540, 860, 920, 610, 330, 140][i] ?? 0 })),
      activity: [
        { id: "a1", type: "admission", text: "New student admitted — Sneha Patil (SE IT)", time: "10 min ago" },
        { id: "a2", type: "fee", text: "Fee payment received — ₹45,000 from Rohan Deshmukh", time: "32 min ago" },
        { id: "a3", type: "timetable", text: "TE Computer Engineering timetable published", time: "1 hr ago" },
        { id: "a4", type: "faculty", text: "Faculty added — Prof. Sachin Kadam (Mechanical)", time: "3 hrs ago" },
        { id: "a5", type: "hostel", text: "Room S-204 allocated in Saraswati Boys Hostel", time: "5 hrs ago" },
        { id: "a6", type: "library", text: "Book issued — 'Operating System Concepts' to Ananya Joshi", time: "Yesterday" },
      ],
      events: [
        { id: "e1", title: "TE Mid-Semester Examinations begin", date: addDays(REF_DATE, 6), category: "Exam" },
        { id: "e2", title: "Second instalment fee deadline", date: addDays(REF_DATE, 10), category: "Fee" },
        { id: "e3", title: "Direct Second Year admission closes", date: addDays(REF_DATE, 14), category: "Admission" },
        { id: "e4", title: "Impetus & Concepts tech fest", date: addDays(REF_DATE, 21), category: "Event" },
        { id: "e5", title: "BE Project review — Phase I", date: addDays(REF_DATE, 25), category: "Exam" },
      ],
    };
  },
  async getStudentDashboard(studentId) {
    await mockDelay();
    return {
      name: "Aarav Kulkarni", studentId, program: "B.E. Computer Engineering — TE, Div A",
      attendancePct: 84.6, cgpa: 8.72, feesDue: 45000, booksIssued: 2, hostelRoom: "Saraswati Boys Hostel · S-101",
      isDemoMetrics: true,
      attendanceBySubject: [
        { subject: "DBMS", pct: 88 }, { subject: "TOC", pct: 79 }, { subject: "CN", pct: 86 }, { subject: "SPOS", pct: 72 }, { subject: "HCI", pct: 92 },
      ],
      upcoming: [
        { id: "u1", title: "DBMS Mid-Sem Exam", date: addDays(REF_DATE, 6), category: "Exam" },
        { id: "u2", title: "Fee instalment due ₹45,000", date: addDays(REF_DATE, 10), category: "Fee" },
        { id: "u3", title: "Return 'Computer Networks' (library)", date: addDays(REF_DATE, 3), category: "Library" },
      ],
    };
  },
};

const restDashboardService: DashboardService = {
  getSummary: () => apiClient.get(`${apiConfig.dashboard.baseUrl}/summary`), // GET /api/dashboard/summary
  getStudentDashboard: (id) => apiClient.get(`${apiConfig.dashboard.baseUrl}/student/${id}`), // GET /api/dashboard/student/:id
};

export const dashboardService: DashboardService = apiConfig.dashboard.useMock ? mockDashboardService : restDashboardService;
