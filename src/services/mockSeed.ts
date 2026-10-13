/**
 * Deterministic seed helpers shared by every module's mockData.ts.
 * No Math.random at module scope — rosters are built lazily and memoised.
 */
export const REF_DATE = "2026-10-05";

export const DEPARTMENTS = [
  { code: "CE", name: "Computer Engineering" },
  { code: "IT", name: "Information Technology" },
  { code: "ENTC", name: "E&TC" },
  { code: "ME", name: "Mechanical" },
  { code: "CV", name: "Civil" },
  { code: "EL", name: "Electronics" },
] as const;

export const DEPARTMENT_NAMES = DEPARTMENTS.map((d) => d.name);
export const YEARS = ["FE", "SE", "TE", "BE"] as const;
export const DIVISIONS = ["A", "B", "C"] as const;

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const pick = <T>(r: () => number, arr: readonly T[]): T => arr[Math.floor(r() * arr.length)]!;
export const int = (r: () => number, min: number, max: number) => Math.floor(r() * (max - min + 1)) + min;

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const STUDENT_NAMES = [
  ["Aarav Kulkarni", "M"], ["Sneha Patil", "F"], ["Rohan Deshmukh", "M"], ["Ananya Joshi", "F"],
  ["Vedant Shinde", "M"], ["Priya Iyer", "F"], ["Siddharth Rao", "M"], ["Isha Bhosale", "F"],
  ["Aditya Pawar", "M"], ["Kavya Nair", "F"], ["Omkar Jadhav", "M"], ["Riya Mehta", "F"],
  ["Harsh Gupta", "M"], ["Tanvi Gokhale", "F"], ["Yash Chavan", "M"], ["Pooja Reddy", "F"],
  ["Nikhil Sharma", "M"], ["Shruti Kale", "F"], ["Atharva Mane", "M"], ["Neha Wagh", "F"],
] as const;

export interface RosterStudent {
  id: string;
  name: string;
  gender: "M" | "F";
  department: string;
  year: (typeof YEARS)[number];
  division: string;
  rollNo: string;
  email: string;
  phone: string;
}

let studentRoster: RosterStudent[] | null = null;
export function getStudentRoster(): RosterStudent[] {
  if (studentRoster) return studentRoster;
  const r = rng(42);
  const roster: RosterStudent[] = STUDENT_NAMES.map(([name, gender], i) => {
    const dept = DEPARTMENTS[i % DEPARTMENTS.length];
    const department = i === 0 ? "Computer Engineering" : (dept?.name ?? "Computer Engineering");
    const year = (i === 0 ? "TE" : (YEARS[i % 4] ?? "TE")) as (typeof YEARS)[number];
    const division = DIVISIONS[i % 3] ?? "A";
    const code = DEPARTMENTS.find((d) => d.name === department)?.code ?? "CE";
    const parts = name.split(" ");
    const first = parts[0]?.toLowerCase() ?? "student";
    const last = parts[1]?.toLowerCase() ?? "pict";
    return {
      id: `STU2023${String(i + 1).padStart(3, "0")}`,
      name,
      gender,
      department,
      year,
      division,
      rollNo: `${year}${code}${division}${String(10 + i).padStart(2, "0")}`,
      email: `${first}.${last}@pict.edu`,
      phone: `9${int(r, 100000000, 999999999)}`,
    };
  });
  studentRoster = roster;
  return roster;
}

const FACULTY_NAMES = [
  ["Dr. Rajesh Kulkarni", "Professor"], ["Prof. Meera Deshpande", "Associate Professor"],
  ["Dr. Suresh Patil", "HOD"], ["Prof. Anjali Kulkarni", "Assistant Professor"],
  ["Dr. Vivek Joshi", "Professor"], ["Prof. Sunita Rane", "Assistant Professor"],
  ["Dr. Prakash Shah", "HOD"], ["Prof. Kiran Bhagat", "Associate Professor"],
  ["Dr. Smita Apte", "Professor"], ["Prof. Amol Gaikwad", "Assistant Professor"],
  ["Dr. Neelam Saxena", "HOD"], ["Prof. Rahul Thakur", "Assistant Professor"],
  ["Dr. Vandana Mishra", "Associate Professor"], ["Prof. Sachin Kadam", "Assistant Professor"],
  ["Dr. Arvind Menon", "HOD"], ["Prof. Swati Ghorpade", "Associate Professor"],
] as const;

export interface RosterFaculty {
  id: string;
  name: string;
  designation: string;
  department: string;
  email: string;
  phone: string;
}

let facultyRoster: RosterFaculty[] | null = null;
export function getFacultyRoster(): RosterFaculty[] {
  if (facultyRoster) return facultyRoster;
  const r = rng(7);
  const roster: RosterFaculty[] = FACULTY_NAMES.map(([name, designation], i) => {
    const clean = name.replace(/^(Dr\.|Prof\.)\s/, "").toLowerCase().split(" ");
    const dept = DEPARTMENTS[i % DEPARTMENTS.length];
    return {
      id: `FAC${String(i + 1).padStart(3, "0")}`,
      name,
      designation,
      department: dept?.name ?? "Computer Engineering",
      email: `${clean[0] ?? "faculty"}.${clean[1] ?? "staff"}@pict.edu`,
      phone: `98${int(r, 10000000, 99999999)}`,
    };
  });
  facultyRoster = roster;
  return roster;
}

export const SUBJECTS = [
  { code: "CE301", name: "Database Management Systems", dept: "Computer Engineering", sem: 5, credits: 4 },
  { code: "CE302", name: "Theory of Computation", dept: "Computer Engineering", sem: 5, credits: 3 },
  { code: "CE303", name: "Computer Networks", dept: "Computer Engineering", sem: 5, credits: 4 },
  { code: "CE201", name: "Data Structures & Algorithms", dept: "Computer Engineering", sem: 3, credits: 4 },
  { code: "IT302", name: "Software Engineering", dept: "Information Technology", sem: 5, credits: 3 },
  { code: "IT304", name: "Web Technologies", dept: "Information Technology", sem: 5, credits: 4 },
  { code: "ET301", name: "Digital Signal Processing", dept: "E&TC", sem: 5, credits: 4 },
  { code: "ME301", name: "Thermodynamics", dept: "Mechanical", sem: 5, credits: 4 },
  { code: "CV301", name: "Structural Analysis", dept: "Civil", sem: 5, credits: 4 },
  { code: "EL301", name: "Microcontrollers", dept: "Electronics", sem: 5, credits: 3 },
] as const;
