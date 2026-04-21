import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { fail } from '../utils/response.js';

export function authenticateToken(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return next(fail('Authentication token is required', 401));

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = { id: Number(payload.userId) };
    return next();
  } catch {
    return next(fail('Invalid or expired token', 401));
  }
}
