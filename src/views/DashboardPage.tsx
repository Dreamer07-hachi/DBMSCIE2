import { Link } from "@tanstack/react-router";
import {
  Activity,
  BedDouble,
  BookOpen,
  Building2,
  CalendarClock,
  CalendarDays,
  GraduationCap,
  IndianRupee,
  Info,
  Library,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { ChartCard } from "@/components/ChartCard";
import { KpiCard, KpiGrid } from "@/components/KpiCard";
import { PageHeader, Section } from "@/components/PageHeader";
import { ErrorState, LoadingSkeleton } from "@/components/States";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/usePermissions";
import { useServiceQuery } from "@/hooks/useServiceQuery";
import { getErrorMessage } from "@/services/apiClient";
import { dashboardService } from "@/services/dashboardService";
import { formatDate, formatINR, formatINRCompact, formatNumber } from "@/utils/format";

export function DashboardPage() {
  const { isStudent, user } = usePermissions();
  const studentId = user?.studentId || (isStudent ? "STU2023001" : undefined);
  return isStudent && studentId ? (
    <StudentDashboard studentId={studentId} />
  ) : (
    <AdminDashboard />
  );
}

function AdminDashboard() {
  const q = useServiceQuery(["dashboard"], dashboardService.getSummary);
  const { user } = usePermissions();
  if (q.isLoading) return <LoadingSkeleton variant="page" />;
  if (q.isError || !q.data) return <ErrorState message={getErrorMessage(q.error)} onRetry={() => q.refetch()} />;
  const d = q.data;
  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user?.name ? user.name.split(" ").slice(0, 2).join(" ") : "Administrator"}`}
        description="College-wide overview for academic year 2026–27"
      />
      <KpiGrid>
        <KpiCard label="Total Students" value={formatNumber(d.kpis.totalStudents)} icon={GraduationCap} />
        <KpiCard label="New Admissions" value={formatNumber(d.kpis.newAdmissions)} icon={UserPlus} accent="teal" hint="AY 2026–27" />
        <KpiCard label="Faculty Members" value={formatNumber(d.kpis.facultyMembers)} icon={Users} />
        <KpiCard label="Attendance" value={`${d.kpis.attendancePct}%`} icon={Activity} accent="success" hint="This month" />
        <KpiCard label="Pending Fees" value={formatINRCompact(d.kpis.pendingFees)} icon={IndianRupee} accent="amber" />
        <KpiCard label="Upcoming Exams" value={d.kpis.upcomingExams} icon={CalendarClock} accent="teal" hint="Next 30 days" />
        <KpiCard label="Hostel Occupancy" value={`${d.kpis.hostelOccupancyPct}%`} icon={Building2} />
        <KpiCard label="Books Issued" value={formatNumber(d.kpis.booksIssued)} icon={Library} accent="teal" />
      </KpiGrid>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Enrollment trend" type="line" data={d.enrollmentTrend} xKey="year" series={[{ key: "students", label: "Students" }]} />
        <ChartCard title="Department-wise distribution" type="pie" data={d.departmentDistribution} xKey="department" series={[{ key: "students", label: "Students" }]} />
        <ChartCard title="Attendance overview (%)" type="area" data={d.attendanceOverview} xKey="month" series={[{ key: "attendance", label: "Attendance %" }]} />
        <ChartCard title="Fee collected vs pending" type="bar" data={d.feeCollection} xKey="month" series={[{ key: "collected", label: "Collected" }, { key: "pending", label: "Pending" }]} valueFormatter={formatINRCompact} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Exam performance (grade distribution)" type="bar" data={d.examPerformance} xKey="grade" series={[{ key: "students", label: "Students" }]} />
        <Section title="Recent activity">
          <ul className="divide-y">
            {d.activity.map((a) => (
              <li key={a.id} className="px-4 py-3">
                <p className="text-sm">{a.text}</p>
                <p className="text-xs text-muted-foreground">{a.time}</p>
              </li>
            ))}
          </ul>
        </Section>
        <Section title="Upcoming events">
          <ul className="divide-y">
            {d.events.map((e) => (
              <li key={e.id} className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm">{e.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(e.date)}</p>
                </div>
                <StatusBadge status={e.category} tone={e.category === "Fee" ? "warning" : e.category === "Exam" ? "info" : "neutral"} />
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}

function StudentDashboard({ studentId }: { studentId: string }) {
  const { user } = usePermissions();
  const q = useServiceQuery(["dashboard", "student", studentId], () => dashboardService.getStudentDashboard(studentId));

  if (q.isLoading) return <LoadingSkeleton variant="page" />;
  if (q.isError || !q.data) return <ErrorState message={getErrorMessage(q.error)} onRetry={() => q.refetch()} />;

  const d = q.data;
  // Use real authenticated user identity
  const currentStudentName = user?.name || d.name;
  const currentStudentId = user?.studentId || studentId;
  const currentProgram = user?.department
    ? `B.E. ${user.department} — TE, Div A`
    : d.program;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hello, ${currentStudentName.split(" ")[0]}`}
        description={`${currentStudentId} · ${currentProgram}`}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/students/$id" params={{ id: currentStudentId }}>
              View my profile
            </Link>
          </Button>
        }
      />

      {/* Transparent notice identifying that metrics are demo data until live ERP modules sync */}
      <div className="flex items-start gap-2.5 rounded-lg border border-amber/30 bg-amber/10 p-3 text-xs text-amber-900 dark:text-amber-200">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" />
        <div className="space-y-0.5">
          <p className="font-semibold text-amber-800 dark:text-amber-300">
            Authenticated Profile Connected · Academic Modules Demo Notice
          </p>
          <p className="text-amber-800/90 dark:text-amber-200/90">
            Identity for <strong>{currentStudentName}</strong> ({currentStudentId}) is loaded from your active session.
            The academic metrics below (attendance, CGPA, fees, books, and hostel records) are currently demo records pending connection to live departmental database tables.
          </p>
        </div>
      </div>

      <KpiGrid cols={5}>
        <KpiCard label="My Attendance" value={`${d.attendancePct}%`} icon={Activity} accent="success" hint="Demo record" />
        <KpiCard label="CGPA" value={d.cgpa.toFixed(2)} icon={GraduationCap} hint="Demo record" />
        <KpiCard label="Fees Due" value={formatINR(d.feesDue)} icon={IndianRupee} accent="amber" hint="Demo record" />
        <KpiCard label="Books Issued" value={d.booksIssued} icon={BookOpen} accent="teal" hint="Demo record" />
        <KpiCard label="Hostel" value={<span className="text-base">{d.hostelRoom}</span>} icon={BedDouble} hint="Demo record" />
      </KpiGrid>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard
            title="Attendance by subject (%)"
            type="bar"
            data={d.attendanceBySubject}
            xKey="subject"
            series={[{ key: "pct", label: "Attendance %" }]}
          />
        </div>
        <Section title="Upcoming">
          <ul className="divide-y">
            {d.upcoming.map((u) => (
              <li key={u.id} className="flex items-start gap-3 px-4 py-3">
                <CalendarDays className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm">{u.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(u.date)} · {u.category}</p>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      {/* Quick Action Navigation / Placeholders */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Button
          variant="outline"
          onClick={() =>
            toast.info("Academic Timetable", {
              description: "Full semester timetable will sync with the Academic & Courses module.",
            })
          }
        >
          My timetable
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast.info("Examination Results", {
              description: "Mid-sem and End-sem scorecards will sync with Examinations module.",
            })
          }
        >
          My results
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast.info("Fees & Payments", {
              description: "Tuition and hostel fee receipts will sync with the Fees & Finance module.",
            })
          }
        >
          My fee receipts
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast.info("Student Services", {
              description: "Hostel allocation and bonafide request portal will be enabled here.",
            })
          }
        >
          Raise a request
        </Button>
      </div>
    </div>
  );
}
