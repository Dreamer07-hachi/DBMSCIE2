-- ========================================================
-- PICT College ERP - Database Schema
-- Pune Institute of Computer Technology
-- ========================================================

CREATE DATABASE IF NOT EXISTS pict_erp
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE pict_erp;

-- Users table supporting Student, Faculty, and Admin roles
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  student_id VARCHAR(50) UNIQUE NULL,
  faculty_id VARCHAR(50) UNIQUE NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM(
    'super_admin',
    'admission_officer',
    'academic_admin',
    'faculty',
    'hr_admin',
    'accounts_officer',
    'hostel_admin',
    'librarian',
    'student'
  ) NOT NULL DEFAULT 'student',
  department VARCHAR(100) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_student_id (student_id),
  INDEX idx_users_faculty_id (faculty_id),
  INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional user sessions table for token revocation or audit logging
CREATE TABLE IF NOT EXISTS user_sessions (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  user_agent VARCHAR(255) NULL,
  ip_address VARCHAR(45) NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sessions_user_id (user_id),
  INDEX idx_sessions_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student profile details table (optional extension for rich student attributes)
CREATE TABLE IF NOT EXISTS student_profiles (
  student_id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL UNIQUE,
  program VARCHAR(120) NOT NULL,
  year_of_study ENUM('FE', 'SE', 'TE', 'BE') NOT NULL DEFAULT 'TE',
  division VARCHAR(10) NOT NULL DEFAULT 'A',
  roll_number VARCHAR(20) NULL,
  cgpa DECIMAL(3, 2) DEFAULT 8.50,
  attendance_pct DECIMAL(5, 2) DEFAULT 85.00,
  fees_due INT DEFAULT 0,
  books_issued INT DEFAULT 0,
  hostel_room VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
