export type StudentStatus = "Active" | "Inactive" | "Alumni" | "Suspended";

export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  gender: "Male" | "Female";
  dob: string;
  department: string;
  program: string;
  year: string;
  division: string;
  rollNo: string;
  admissionYear: number;
  status: StudentStatus;
  address: string;
  city: string;
  bloodGroup: string;
  category: string;
  parentName: string;
  parentPhone: string;
  parentOccupation: string;
  admissionType: string;
  entranceScore: number;
}

export type ApplicationStatus = "Pending" | "Under Review" | "Approved" | "Rejected";
export type DocStatus = "Pending" | "Verified" | "Rejected";

export interface ApplicationDocument {
  name: string;
  status: DocStatus;
}

export interface Application {
  id: string;
  applicantName: string;
  email: string;
  phone: string;
  program: string;
  department: string;
  entranceExam: string;
  score: number;
  appliedOn: string;
  status: ApplicationStatus;
  category: string;
  documents: ApplicationDocument[];
  remarks?: string | undefined;
  history: { date: string; action: string; by: string }[];
}

export interface StudentStats {
  total: number;
  active: number;
  newAdmissions: number;
  byDepartment: { department: string; students: number }[];
  byYear: { year: string; students: number }[];
}

export interface AdmissionStats {
  pending: number;
  underReview: number;
  approved: number;
  rejected: number;
}

/** Read-only summaries owned by other modules (fetched from their APIs in production). */
export interface CrossModuleSummary {
  attendance: { overall: number; subjects: { subject: string; pct: number }[] };
  examination: { cgpa: number; lastSgpa: number; backlogs: number };
  fees: { total: number; paid: number; pending: number; status: string };
  hostel: { allocated: boolean; hostel?: string; room?: string };
  library: { issued: number; overdue: number; fines: number };
  documents: { name: string; status: string }[];
}
