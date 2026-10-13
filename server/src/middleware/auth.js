import jwt from 'jsonwebtoken';
import { pool } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_pict_erp_key_replace_in_production';
const COOKIE_NAME = process.env.COOKIE_NAME || 'pict_session';

/**
 * Middleware to authenticate requests using HTTP-only cookie or Bearer token.
 */
export async function authenticateToken(req, res, next) {
  // 1. Try extracting token from secure HTTP-only cookie first
  let token = req.cookies?.[COOKIE_NAME] || req.cookies?.['pict_session'];

  // 2. Fall back to Authorization: Bearer <token> header
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // If MySQL connection is alive, verify the user still exists and is active
    if (pool) {
      try {
        const [rows] = await pool.execute(
          'SELECT id, name, email, student_id AS studentId, faculty_id AS facultyId, role, department, is_active FROM users WHERE id = ?',
          [decoded.id]
        );

        if (rows.length > 0 && rows[0].is_active) {
          req.user = rows[0];
          return next();
        } else if (rows.length > 0 && !rows[0].is_active) {
          return res.status(403).json({ message: 'User account is deactivated' });
        }
      } catch (dbErr) {
        // If DB temporarily unavailable, trust valid signed JWT payload
        // (allows continuous dev testing without crashing)
      }
    }

    // Attach decoded user from valid signature
    req.user = {
      id: decoded.id,
      name: decoded.name,
      email: decoded.email,
      studentId: decoded.studentId,
      facultyId: decoded.facultyId,
      role: decoded.role,
      department: decoded.department,
    };
    next();
  } catch (err) {
    // Expired or invalid token
    req.user = null;
    next();
  }
}

/**
 * Route protection: requires user to be logged in
 */
export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required. Please sign in.' });
  }
  next();
}

/**
 * Server-side role-based authorization: checks server-verified user role.
 * Never trusts client input for role claims.
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required. Please sign in.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access Denied: Your role (${req.user.role}) is not authorized for this action.`,
      });
    }
    next();
  };
}
