/**
 * Security headers middleware.
 * Sets standard security headers without requiring external dependencies like helmet.
 */
export function securityHeaders(req, res, next) {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Enable XSS filter in older browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Control referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Restrict permissions
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Remove powered-by header
  res.removeHeader('X-Powered-By');

  next();
}
