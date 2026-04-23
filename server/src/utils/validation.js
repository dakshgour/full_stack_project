import { env } from '../config/env.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
const ALLOWED_LANGUAGES = new Set(['javascript', 'python', 'cpp', 'java']);
const FORBIDDEN_PATTERNS = [
  /require\s*\(/i,
  /process\./i,
  /fs\./i,
  /child_process/i,
  /subprocess/i,
  /system\s*\(/i,
  /exec\s*\(/i,
  /spawn\s*\(/i,
  /while\s*\(\s*true\s*\)/i,
];

export function validateSignup({ email, password, name }) {
  if (!EMAIL_REGEX.test(email || '')) throw new Error('Email must be a valid format');
  if (!PASSWORD_REGEX.test(password || '')) {
    throw new Error('Password must be 8+ chars and include uppercase, lowercase, number, and special character');
  }
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
    throw new Error('Name must be between 2 and 100 characters');
  }
}

export function validateLogin({ email, password }) {
  if (!EMAIL_REGEX.test(email || '')) throw new Error('Email must be a valid format');
  if (!password) throw new Error('Password is required');
}

export function validateVerifyEmail({ email, otp }) {
  if (!EMAIL_REGEX.test(email || '')) throw new Error('Email must be a valid format');
  if (!otp || typeof otp !== 'string' || otp.length !== 6) throw new Error('OTP must be a 6-digit code');
}

export function validateForgotPassword({ email }) {
  if (!EMAIL_REGEX.test(email || '')) throw new Error('Email must be a valid format');
}

export function validateResetPassword({ email, otp, newPassword }) {
  if (!EMAIL_REGEX.test(email || '')) throw new Error('Email must be a valid format');
  if (!otp || typeof otp !== 'string' || otp.length !== 6) throw new Error('OTP must be a 6-digit code');
  if (!PASSWORD_REGEX.test(newPassword || '')) {
    throw new Error('Password must be 8+ chars and include uppercase, lowercase, number, and special character');
  }
}

export function validateCodePayload(payload) {
  const { title, code, language, dsaPattern } = payload;
  if (!title || typeof title !== 'string' || title.trim().length < 3) throw new Error('Title must be at least 3 characters');
  if (!code || typeof code !== 'string') throw new Error('Code is required');
  if (code.length > env.maxCodeLength) throw new Error('Code payload is too large');
  if (!ALLOWED_LANGUAGES.has(language)) throw new Error('Language must be javascript, python, cpp, or java');
  if (!dsaPattern || typeof dsaPattern !== 'string') throw new Error('dsaPattern is required');
}

export function validateExecutionPayload(payload) {
  const { code, language, inputOverride = '' } = payload;
  if (!code || typeof code !== 'string') throw new Error('Code is required');
  if (code.length > env.maxCodeLength) throw new Error('Code payload is too large');
  if (!ALLOWED_LANGUAGES.has(language)) throw new Error('Unsupported language');
  if (inputOverride.length > env.maxInputLength) throw new Error('Input override is too large');
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(code)) {
      throw new Error('Code contains restricted tokens for MVP execution');
    }
  }
}

export function safeJsonParse(value, fallback = null) {
  if (value == null) return fallback;
  try {
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch {
    return fallback;
  }
}
