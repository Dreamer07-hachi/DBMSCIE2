import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { pool, testDbConnection } from '../src/db.js';

dotenv.config();

/**
 * Development-only safe sample accounts.
 * Passwords are hashed with bcrypt before insertion.
 * No public default administrator accounts with trivial credentials are exposed without salt.
 */
export const SAMPLE_USERS = [
  {
    id: 'U001',
    name: 'Dr. Anil Bhandari',
    email: 'admin@pict.edu',
    student_id: null,
    faculty_id: null,
    role: 'super_admin',
    department: 'Administration',
    rawPassword: process.env.SEED_ADMIN_PASSWORD || 'pict@Admin2026',
  },
  {
    id: 'U004',
    name: 'Prof. Meera Deshpande',
    email: 'faculty@pict.edu',
    student_id: null,
    faculty_id: 'FAC002',
    role: 'faculty',
    department: 'Computer Engineering',
    rawPassword: process.env.SEED_FACULTY_PASSWORD || 'pict@Faculty2026',
  },
  {
    id: 'U009',
    name: 'Aarav Kulkarni',
    email: 'aarav.kulkarni@pict.edu',
    student_id: 'STU2023001',
    faculty_id: null,
    role: 'student',
    department: 'Computer Engineering',
    rawPassword: process.env.SEED_STUDENT_PASSWORD || 'pict@Student2026',
  },
  {
    id: 'U002',
    name: 'Mrs. Shalini Kapoor',
    email: 'admissions@pict.edu',
    student_id: null,
    faculty_id: null,
    role: 'admission_officer',
    department: 'Admissions Office',
    rawPassword: process.env.SEED_STAFF_PASSWORD || 'pict@Staff2026',
  },
  {
    id: 'U003',
    name: 'Dr. Manish Verma',
    email: 'academic@pict.edu',
    student_id: null,
    faculty_id: null,
    role: 'academic_admin',
    department: 'Academics',
    rawPassword: process.env.SEED_STAFF_PASSWORD || 'pict@Staff2026',
  },
];

export async function runSeed() {
  console.log('🌱 Starting development seed...');
  const connected = await testDbConnection();
  if (!connected) {
    console.error('❌ Cannot run database seed: MySQL connection failed.');
    console.error('   Please check that MySQL server is running and server/.env has valid DB credentials.');
    process.exit(1);
  }

  try {
    // 1. Ensure table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        student_id VARCHAR(50) UNIQUE NULL,
        faculty_id VARCHAR(50) UNIQUE NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('super_admin', 'admission_officer', 'academic_admin', 'faculty', 'hr_admin', 'accounts_officer', 'hostel_admin', 'librarian', 'student') NOT NULL DEFAULT 'student',
        department VARCHAR(100) NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_users_email (email),
        INDEX idx_users_student_id (student_id),
        INDEX idx_users_role (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Insert or update sample users safely with bcrypt hashes
    for (const user of SAMPLE_USERS) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(user.rawPassword, salt);

      const [existing] = await pool.execute(
        'SELECT id, email FROM users WHERE email = ?',
        [user.email]
      );

      if (existing.length === 0) {
        await pool.execute(
          `INSERT INTO users (id, name, email, student_id, faculty_id, password_hash, role, department)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            user.id,
            user.name,
            user.email,
            user.student_id,
            user.faculty_id,
            passwordHash,
            user.role,
            user.department,
          ]
        );
        console.log(`   ✓ Inserted user: ${user.name} (${user.email}) [Role: ${user.role}]`);
      } else {
        // Update password hash and details to match seed
        await pool.execute(
          `UPDATE users SET name = ?, student_id = ?, faculty_id = ?, password_hash = ?, role = ?, department = ?
           WHERE email = ?`,
          [
            user.name,
            user.student_id,
            user.faculty_id,
            passwordHash,
            user.role,
            user.department,
            user.email,
          ]
        );
        console.log(`   ↻ Updated existing user: ${user.name} (${user.email})`);
      }
    }

    console.log('\n🎉 Seed completed successfully!');
    console.log('Sample Accounts for testing:');
    console.log('  • Admin:   admin@pict.edu           Password: ' + (process.env.SEED_ADMIN_PASSWORD || 'pict@Admin2026'));
    console.log('  • Faculty: faculty@pict.edu         Password: ' + (process.env.SEED_FACULTY_PASSWORD || 'pict@Faculty2026'));
    console.log('  • Student: aarav.kulkarni@pict.edu  Password: ' + (process.env.SEED_STUDENT_PASSWORD || 'pict@Student2026') + ' (Student ID: STU2023001)');
    console.log('  • Student login also accepts student ID as identifier: "STU2023001"');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during seed:', err);
    process.exit(1);
  }
}

// Auto-run when executed directly via node database/seed.js
if (process.argv[1]?.endsWith('seed.js')) {
  runSeed();
}
