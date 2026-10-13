import { addDays, DEPARTMENTS, getStudentRoster, int, pick, REF_DATE, rng } from "@/services/mockSeed";
import type { Application, Student } from "./types";

const CITIES = ["Pune", "Mumbai", "Nashik", "Nagpur", "Kolhapur", "Aurangabad", "Satara", "Solapur"];
const OCCUPATIONS = ["Engineer", "Teacher", "Business", "Doctor", "Government Service", "Farmer", "Bank Officer"];
const BLOOD = ["A+", "B+", "O+", "AB+", "O-", "B-"];
const CATEGORIES = ["Open", "OBC", "SC", "ST", "EWS", "NT"];
const YEAR_TO_ADMIT: Record<string, number> = { FE: 2026, SE: 2025, TE: 2024, BE: 2023 };

export function seedStudents(): Student[] {
  const r = rng(101);
  return getStudentRoster().map((s, i) => ({
    id: s.id,
    name: s.name,
    email: s.email,
    phone: s.phone,
    gender: s.gender === "M" ? "Male" : "Female",
    dob: `${2003 + (i % 4)}-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 27) + 1).padStart(2, "0")}`,
    department: s.department,
    program: "B.E.",
    year: s.year,
    division: s.division,
    rollNo: s.rollNo,
    admissionYear: YEAR_TO_ADMIT[s.year] ?? 2024,
    status: i === 7 ? "Inactive" : i === 15 ? "Suspended" : "Active",
    address: `${int(r, 1, 220)}, ${pick(r, ["Shivaji Nagar", "Kothrud", "Baner", "Hadapsar", "Katraj", "Aundh"])}`,
    city: pick(r, CITIES),
    bloodGroup: pick(r, BLOOD),
    category: pick(r, CATEGORIES),
    parentName: `${pick(r, ["Ramesh", "Suresh", "Vijay", "Sanjay", "Mahesh", "Prakash"])} ${s.name.split(" ")[1]}`,
    parentPhone: `9${int(r, 100000000, 999999999)}`,
    parentOccupation: pick(r, OCCUPATIONS),
    admissionType: pick(r, ["CAP Round I", "CAP Round II", "Institute Level", "Direct Second Year"]),
    entranceScore: int(r, 9200, 9980) / 100,
  }));
}

const APPLICANTS = [
  "Arjun Bhatt", "Sakshi Kulkarni", "Pranav Desai", "Mrunal Pathak", "Karan Malhotra", "Gauri Sathe",
  "Tejas Naik", "Sanika Bapat", "Varun Sinha", "Aditi Ranade", "Kunal Agarwal", "Shravani More",
  "Rutuja Kamble", "Soham Phadke", "Manasi Dixit", "Chinmay Oak",
];
const DOCS = ["10th Marksheet", "12th Marksheet", "MHT-CET Scorecard", "Leaving Certificate", "Domicile Certificate", "Aadhaar Card"];

export function seedApplications(): Application[] {
  const r = rng(202);
  return APPLICANTS.map((name, i) => {
    const statuses = ["Pending", "Under Review", "Approved", "Rejected", "Pending", "Under Review"] as const;
    const status = statuses[i % 6]!;
    const appliedOn = addDays(REF_DATE, -int(r, 3, 60));
    const first = (name.split(" ")[0] ?? "applicant").toLowerCase();
    const dept = DEPARTMENTS[i % DEPARTMENTS.length];
    return {
      id: `APP26${String(i + 1).padStart(3, "0")}`,
      applicantName: name,
      email: `${first}${int(r, 10, 99)}@gmail.com`,
      phone: `9${int(r, 100000000, 999999999)}`,
      program: "B.E.",
      department: dept?.name ?? "Computer Engineering",
      entranceExam: i % 3 === 0 ? "JEE Main" : "MHT-CET",
      score: int(r, 8500, 9970) / 100,
      appliedOn,
      status,
      category: pick(r, CATEGORIES),
      documents: DOCS.map((d, j) => ({
        name: d,
        status: status === "Approved" ? "Verified" : status === "Rejected" && j === 2 ? "Rejected" : j < 2 ? "Verified" : "Pending",
      })),
      remarks: status === "Rejected" ? "Scorecard mismatch with CET cell records" : undefined,
      history: [
        { date: appliedOn, action: "Application submitted", by: name },
        ...(status !== "Pending" ? [{ date: addDays(appliedOn, 2), action: "Moved to review", by: "Mrs. Shalini Kapoor" }] : []),
        ...(status === "Approved" || status === "Rejected" ? [{ date: addDays(appliedOn, 5), action: `Application ${status.toLowerCase()}`, by: "Mrs. Shalini Kapoor" }] : []),
      ],
    };
  });
}
