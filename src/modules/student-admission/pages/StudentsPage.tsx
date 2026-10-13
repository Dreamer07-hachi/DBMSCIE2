import { useNavigate } from "@tanstack/react-router";
import { GraduationCap, Hourglass, ThumbsDown, ThumbsUp, UserCheck, UserPlus, UserRound } from "lucide-react";
import { ChartCard } from "@/components/ChartCard";
import { CrudSection } from "@/components/CrudSection";
import { KpiCard, KpiGrid } from "@/components/KpiCard";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useServiceQuery } from "@/hooks/useServiceQuery";
import { DEPARTMENT_NAMES, YEARS } from "@/services/mockSeed";
import { admissionService, studentService } from "../service";
import type { Student } from "../types";
import { studentFromForm } from "../utils";
import { studentDefaults, studentFields, studentSchema, type StudentFormValues } from "../validation";

export function StudentsPage() {
  const navigate = useNavigate();
  const stats = useServiceQuery(["students", "stats"], studentService.getStats);
  const adm = useServiceQuery(["applications", "stats"], admissionService.getStats);
  const openProfile = (s: Student) => navigate({ to: "/students/$id", params: { id: s.id } });

  return (
    <div className="space-y-6">
      <PageHeader title="Students" description="Student records across all departments" />
      <KpiGrid cols={5}>
        <KpiCard label="Total Students" value={stats.data?.total ?? "—"} icon={GraduationCap} loading={stats.isLoading} />
        <KpiCard label="New Admissions" value={stats.data?.newAdmissions ?? "—"} icon={UserPlus} accent="teal" loading={stats.isLoading} />
        <KpiCard label="Pending Applications" value={adm.data ? adm.data.pending + adm.data.underReview : "—"} icon={Hourglass} accent="amber" loading={adm.isLoading} />
        <KpiCard label="Approved" value={adm.data?.approved ?? "—"} icon={ThumbsUp} accent="success" loading={adm.isLoading} />
        <KpiCard label="Rejected" value={adm.data?.rejected ?? "—"} icon={ThumbsDown} accent="danger" loading={adm.isLoading} />
      </KpiGrid>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Students by department" type="bar" data={stats.data?.byDepartment ?? []} xKey="department" series={[{ key: "students", label: "Students" }]} loading={stats.isLoading} error={stats.isError} onRetry={() => stats.refetch()} />
        <ChartCard title="Students by year" type="pie" data={stats.data?.byYear ?? []} xKey="year" series={[{ key: "students", label: "Students" }]} loading={stats.isLoading} error={stats.isError} onRetry={() => stats.refetch()} />
      </div>
      <CrudSection<Student>
        queryKey="students"
        service={studentService}
        module="student-admission"
        entityName="Student"
        nameOf={(s) => `${s.name} (${s.id})`}
        exportName="Students"
        searchPlaceholder="Search name, ID, email, phone…"
        onView={openProfile}
        extraActions={[{ label: "Full Profile", icon: <UserRound className="h-4 w-4" />, onClick: openProfile }]}
        columns={[
          { key: "id", header: "Student ID", sortable: true, render: (s) => <span className="font-mono text-xs">{s.id}</span> },
          { key: "name", header: "Name", sortable: true, render: (s) => <span className="font-medium">{s.name}</span> },
          { key: "email", header: "Email" },
          { key: "phone", header: "Phone", hidden: true },
          { key: "department", header: "Department", sortable: true },
          { key: "program", header: "Program" },
          { key: "year", header: "Year", sortable: true },
          { key: "division", header: "Div" },
          { key: "admissionYear", header: "Admitted", sortable: true },
          { key: "status", header: "Status", render: (s) => <StatusBadge status={s.status} /> },
        ]}
        filters={[
          { key: "department", label: "Departments", options: DEPARTMENT_NAMES },
          { key: "year", label: "Years", options: YEARS },
          { key: "status", label: "Statuses", options: ["Active", "Inactive", "Alumni", "Suspended"] },
        ]}
        fields={studentFields}
        schema={studentSchema}
        defaults={studentDefaults}
        fromForm={(v, row) => studentFromForm(v as StudentFormValues, row)}
      />
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><UserCheck className="h-3.5 w-3.5" />Click a row's ⋯ menu to view the full profile, edit or delete.</p>
    </div>
  );
}
