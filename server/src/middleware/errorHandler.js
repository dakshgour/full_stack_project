import { isProduction } from '../config/env.js';

export function notFoundHandler(_req, _res, next) {
  const err = new Error('Route not found');
  err.status = 404;
  next(err);
}

export function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  const payload = {
    success: false,
    error: err.message || 'Internal server error',
  };
  if (!isProduction() && status >= 500) {
    payload.details = err.stack;
  }
  res.status(status).json(payload);
}
