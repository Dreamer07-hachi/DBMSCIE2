import express from 'express';
import { authenticateToken, requireAuth } from '../middleware/auth.js';
import { pool } from '../db.js';

const router = express.Router();

/**
 * GET /api/dashboard/summary
 * Protected: available to administrative/faculty roles
 */
router.get('/summary', authenticateToken, requireAuth, async (req, res) => {
  // Return overview summary for staff/admin
  return res.json({
    kpis: {
      totalStudents: 4218,
      newAdmissions: 1086,
      facultyMembers: 236,
      attendancePct: 82.4,
      pendingFees: 18450000,
      upcomingExams: 14,
      hostelOccupancyPct: 87,
      booksIssued: 1342,
    },
    enrollmentTrend: [
      { year: '2021', students: 3420 },
      { year: '2022', students: 3580 },
      { year: '2023', students: 3740 },
      { year: '2024', students: 3900 },
      { year: '2025', students: 4060 },
      { year: '2026', students: 4218 },
    ],
    departmentDistribution: [
      { department: 'CE', students: 1180 },
      { department: 'IT', students: 860 },
      { department: 'ENTC', students: 720 },
      { department: 'ME', students: 540 },
      { department: 'CV', students: 480 },
      { department: 'EL', students: 438 },
    ],
    attendanceOverview: [
      { month: 'Jun', attendance: 78 },
      { month: 'Jul', attendance: 84 },
      { month: 'Aug', attendance: 81 },
      { month: 'Sep', attendance: 85 },
      { month: 'Oct', attendance: 82 },
    ],
    feeCollection: [
      { month: 'Jun', collected: 9200000, pending: 3200000 },
      { month: 'Jul', collected: 14100000, pending: 2900000 },
      { month: 'Aug', collected: 6800000, pending: 2400000 },
      { month: 'Sep', collected: 4300000, pending: 2050000 },
      { month: 'Oct', collected: 2100000, pending: 1845000 },
    ],
    examPerformance: [
      { grade: 'O', students: 210 },
      { grade: 'A+', students: 540 },
      { grade: 'A', students: 860 },
      { grade: 'B+', students: 920 },
      { grade: 'B', students: 610 },
      { grade: 'C', students: 330 },
      { grade: 'F', students: 140 },
    ],
    activity: [
      { id: 'a1', type: 'admission', text: 'New student admitted — Sneha Patil (SE IT)', time: '10 min ago' },
      { id: 'a2', type: 'fee', text: 'Fee payment received — ₹45,000 from Rohan Deshmukh', time: '32 min ago' },
      { id: 'a3', type: 'timetable', text: 'TE Computer Engineering timetable published', time: '1 hr ago' },
      { id: 'a4', type: 'faculty', text: 'Faculty added — Prof. Sachin Kadam (Mechanical)', time: '3 hrs ago' },
      { id: 'a5', type: 'hostel', text: 'Room S-204 allocated in Saraswati Boys Hostel', time: '5 hrs ago' },
      { id: 'a6', type: 'library', text: 'Book issued — "Operating System Concepts" to Ananya Joshi', time: 'Yesterday' },
    ],
    events: [
      { id: 'e1', title: 'TE Mid-Semester Examinations begin', date: '2026-10-20', category: 'Exam' },
      { id: 'e2', title: 'Second instalment fee deadline', date: '2026-10-24', category: 'Fee' },
      { id: 'e3', title: 'Direct Second Year admission closes', date: '2026-10-28', category: 'Admission' },
      { id: 'e4', title: 'Impetus & Concepts tech fest', date: '2026-11-04', category: 'Event' },
      { id: 'e5', title: 'BE Project review — Phase I', date: '2026-11-08', category: 'Exam' },
    ],
  });
});

/**
 * GET /api/dashboard/student/:id
 * Protected: Student can only view their own dashboard; Admin & Faculty can view any student.
 */
router.get('/student/:id', authenticateToken, requireAuth, async (req, res) => {
  const targetId = req.params.id;

  // Authorization check: student can only query their own ID
  if (req.user.role === 'student' && req.user.studentId && req.user.studentId !== targetId) {
    return res.status(403).json({
      message: 'Access Denied: Students can only access their own dashboard.',
    });
  }

  // Load real student identity from MySQL if available
  let studentName = req.user.name;
  let program = `B.E. ${req.user.department || 'Computer Engineering'} — TE, Div A`;

  if (pool) {
    try {
      const [rows] = await pool.execute(
        'SELECT name, department FROM users WHERE student_id = ? OR id = ?',
        [targetId, targetId]
      );
      if (rows.length > 0) {
        studentName = rows[0].name;
        if (rows[0].department) {
          program = `B.E. ${rows[0].department} — TE, Div A`;
        }
      }
    } catch {
      // Use authenticated user name
    }
  }

  return res.json({
    name: studentName,
    studentId: targetId,
    program,
    // Demo metrics clearly flagged
    attendancePct: 84.6,
    cgpa: 8.72,
    feesDue: 45000,
    booksIssued: 2,
    hostelRoom: 'Saraswati Boys Hostel · S-101',
    isDemoMetrics: true,
    attendanceBySubject: [
      { subject: 'DBMS', pct: 88 },
      { subject: 'TOC', pct: 79 },
      { subject: 'CN', pct: 86 },
      { subject: 'SPOS', pct: 72 },
      { subject: 'HCI', pct: 92 },
    ],
    upcoming: [
      { id: 'u1', title: 'DBMS Mid-Sem Exam', date: '2026-10-20', category: 'Exam' },
      { id: 'u2', title: 'Fee instalment due ₹45,000', date: '2026-10-24', category: 'Fee' },
      { id: 'u3', title: 'Return "Computer Networks" (library)', date: '2026-10-17', category: 'Library' },
    ],
  });
});

export default router;
