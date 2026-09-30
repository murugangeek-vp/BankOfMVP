import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'corebank_super_secret_enterprise_bank_key_2026';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// In-memory failed attempt tracking (keyed by username)
const failedAttemptsMap = new Map();

/**
 * Validate password against Bank-Grade Security Policy
 * Policy:
 * 1. Min 12 characters
 * 2. At least 1 uppercase letter
 * 3. At least 1 lowercase letter
 * 4. At least 1 digit
 * 5. At least 1 special character (!@#$%^&*()_+-=[]{}|;:,.<>?)
 * 6. No common weak passwords
 */
export function validatePasswordStrength(password) {
  const errors = [];
  let score = 0;

  if (!password || typeof password !== 'string') {
    return { isValid: false, score: 0, label: 'INVALID', errors: ['Password is required'] };
  }

  if (password.length >= 12) {
    score += 25;
  } else {
    errors.push('Minimum 12 characters required');
  }

  if (/[A-Z]/.test(password)) {
    score += 20;
  } else {
    errors.push('At least one uppercase letter (A-Z) required');
  }

  if (/[a-z]/.test(password)) {
    score += 20;
  } else {
    errors.push('At least one lowercase letter (a-z) required');
  }

  if (/[0-9]/.test(password)) {
    score += 15;
  } else {
    errors.push('At least one numeric digit (0-9) required');
  }

  if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    score += 20;
  } else {
    errors.push('At least one special symbol (!@#$%^&*) required');
  }

  // Common weak password check
  const commonWeak = ['password', 'password123', '123456789012', 'admin1234567', 'corebank1234'];
  if (commonWeak.includes(password.toLowerCase())) {
    errors.push('Password contains easily guessable dictionary words');
    score = Math.min(score, 30);
  }

  let label = 'WEAK';
  if (score >= 90) label = 'BANK_GRADE';
  else if (score >= 70) label = 'STRONG';
  else if (score >= 50) label = 'MEDIUM';

  return {
    isValid: errors.length === 0,
    score,
    label,
    errors
  };
}

/**
 * Check if username/IP is locked out due to excessive failed logins
 */
export function checkAccountLockout(username) {
  if (!username) return { isLocked: false };

  const record = failedAttemptsMap.get(username.toLowerCase());
  if (!record) return { isLocked: false };

  const now = Date.now();
  if (record.attempts >= MAX_FAILED_ATTEMPTS) {
    const elapsed = now - record.lastAttemptTime;
    if (elapsed < LOCKOUT_DURATION_MS) {
      const remainingMinutes = Math.ceil((LOCKOUT_DURATION_MS - elapsed) / (60 * 1000));
      return {
        isLocked: true,
        remainingMinutes,
        message: `Account temporarily locked due to ${record.attempts} consecutive failed login attempts. Please try again in ${remainingMinutes} minutes.`
      };
    } else {
      // Lockout expired, reset counter
      failedAttemptsMap.delete(username.toLowerCase());
      return { isLocked: false };
    }
  }

  return { isLocked: false };
}

/**
 * Record a failed login attempt
 */
export function recordFailedLogin(username) {
  if (!username) return;
  const key = username.toLowerCase();
  const now = Date.now();
  const record = failedAttemptsMap.get(key) || { attempts: 0, lastAttemptTime: now };
  
  record.attempts += 1;
  record.lastAttemptTime = now;
  failedAttemptsMap.set(key, record);

  return record.attempts;
}

/**
 * Reset failed attempts on successful login
 */
export function clearFailedLogins(username) {
  if (!username) return;
  failedAttemptsMap.delete(username.toLowerCase());
}

/**
 * Issue signed Bank-Grade JWT Token
 */
export function generateToken(user, expiresIn = '15m') {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
      role: user.role,
      iss: 'CoreBank-Enterprise-IDP',
      aud: 'CoreBank-Banking-Portal'
    },
    JWT_SECRET,
    { expiresIn }
  );
}

/**
 * Generate CSRF Token
 */
export function generateCsrfToken() {
  return 'csrf_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Verify JWT Token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

/**
 * Password hash helper
 */
export async function hashPassword(password) {
  return await bcrypt.hash(password, 12);
}
