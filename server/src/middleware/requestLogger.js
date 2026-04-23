/**
 * Request logger middleware — logs method, path, status code, and response time.
 * Colored output in development.
 */
const COLORS = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  reset: '\x1b[0m',
};

function statusColor(code) {
  if (code >= 500) return COLORS.red;
  if (code >= 400) return COLORS.yellow;
  if (code >= 300) return COLORS.cyan;
  return COLORS.green;
}

export function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const color = statusColor(status);
    const method = req.method.padEnd(6);
    const path = req.originalUrl || req.url;

    console.log(
      `${COLORS.dim}[${new Date().toISOString()}]${COLORS.reset} ${color}${method}${COLORS.reset} ${path} ${color}${status}${COLORS.reset} ${COLORS.dim}${duration}ms${COLORS.reset}`
    );
  });

  next();
}
