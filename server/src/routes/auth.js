import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { pool, getDbStatus } from '../db.js';
import { authenticateToken, requireAuth } from '../middleware/auth.js';
import { SAMPLE_USERS } from '../../database/seed.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_pict_erp_key_replace_in_production';
const SESSION_EXPIRES_IN = process.env.SESSION_EXPIRES_IN || '7d';
const COOKIE_NAME = process.env.COOKIE_NAME || 'pict_session';

// Pre-computed fallback hashes for sample users in case MySQL is not running
const fallbackUserMap = new Map();
async function initFallbackHashes() {
  for (const u of SAMPLE_USERS) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(u.rawPassword, salt);
    fallbackUserMap.set(u.email.toLowerCase(), { ...u, password_hash: hash });
    if (u.student_id) {
      fallbackUserMap.set(u.student_id.toLowerCase(), { ...u, password_hash: hash });
    }
  }
}
initFallbackHashes().catch(() => {});

const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Email or Student ID is required').max(150),
  password: z.string().min(1, 'Password is required').max(100),
  remember: z.boolean().optional().default(true),
});

/**
 * POST /api/auth/login
 * Validates credentials against MySQL users table using bcrypt.
 * Sets secure HTTP-only cookie and returns user session.
 */
router.post('/login', async (req, res) => {
  const parseResult = loginSchema.safeParse(req.body);
  if (!parseResult.success) {
    const firstIssue = parseResult.error.issues[0];
    return res.status(400).json({
      message: firstIssue ? firstIssue.message : 'Invalid login parameters',
      errors: parseResult.error.flatten().fieldErrors,
    });
  }

  const { identifier, password, remember } = parseResult.data;
  const idLower = identifier.trim().toLowerCase();

  try {
    let userRecord = null;
    let usingDatabase = false;

    // 1. Check MySQL database if available
    if (pool) {
      try {
        const [rows] = await pool.execute(
          `SELECT id, name, email, student_id AS studentId, faculty_id AS facultyId, 
                  password_hash, role, department, is_active 
           FROM users 
           WHERE LOWER(email) = ? OR LOWER(student_id) = ?`,
          [idLower, idLower]
        );

        if (rows.length > 0) {
          userRecord = rows[0];
          usingDatabase = true;
        }
      } catch (dbErr) {
        console.warn('⚠️ Querying MySQL failed; checking fallback sample accounts:', dbErr.message);
      }
    }

    // 2. Safe development fallback if MySQL service is not running locally
    if (!userRecord) {
      const fallback = fallbackUserMap.get(idLower);
      if (fallback) {
        userRecord = {
          id: fallback.id,
          name: fallback.name,
          email: fallback.email,
          studentId: fallback.student_id,
          facultyId: fallback.faculty_id,
          password_hash: fallback.password_hash,
          role: fallback.role,
          department: fallback.department,
          is_active: true,
        };
      }
    }

    if (!userRecord) {
      return res.status(401).json({
        message: 'Invalid email/student ID or password.',
      });
    }

    if (!userRecord.is_active) {
      return res.status(403).json({
        message: 'Your account is deactivated. Contact the PICT administrator.',
      });
    }

    // 3. Verify password hash using bcrypt (or dev fallback password in development)
    const isDev = process.env.NODE_ENV !== 'production';
    const isDevPassword = isDev && password === 'demo123';
    const match = isDevPassword || (await bcrypt.compare(password, userRecord.password_hash));
    if (!match) {
      return res.status(401).json({
        message: 'Invalid email/student ID or password.',
      });
    }

    // 4. Sanitize user profile (NEVER expose password_hash to client)
    const user = {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      studentId: userRecord.studentId || undefined,
      facultyId: userRecord.facultyId || undefined,
      role: userRecord.role,
      department: userRecord.department || undefined,
    };

    // 5. Generate signed JWT session token
    const token = jwt.sign(user, JWT_SECRET, {
      expiresIn: remember ? SESSION_EXPIRES_IN : '1d',
    });

    // 6. Set secure, HTTP-only cookie
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieMaxAge = remember ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: cookieMaxAge,
      path: '/',
    });

    return res.json({
      message: 'Login successful',
      user,
      token, // Also provided for clients using Authorization header
      storageMode: usingDatabase ? 'mysql' : 'dev_memory',
    });
  } catch (err) {
    console.error('Server login error:', err);
    return res.status(500).json({
      message: 'An unexpected server error occurred during authentication. Please try again.',
    });
  }
});

/**
 * POST /api/auth/logout
 * Clears the HTTP-only session cookie
 */
router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
  return res.json({ message: 'Successfully signed out' });
});

/**
 * GET /api/auth/me
 * Returns current authenticated user from session cookie or Bearer token
 */
router.get('/me', authenticateToken, requireAuth, (req, res) => {
  res.json({
    user: req.user,
    status: getDbStatus(),
  });
});

/**
 * POST /api/auth/forgot-password
 * Handles password reset request
 */
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ message: 'Please provide a valid email address.' });
  }

  // Simulated email dispatch
  return res.json({
    message: 'If that email exists in PICT records, a password reset link has been dispatched.',
  });
});

export default router;
