/**
 * In-memory sliding window rate limiter.
 * No external dependencies required.
 */
const requestCounts = new Map();

function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of requestCounts.entries()) {
    if (now - entry.windowStart > entry.windowMs) {
      requestCounts.delete(key);
    }
  }
}

// Run cleanup every 60 seconds to prevent memory leaks
setInterval(cleanupExpiredEntries, 60000).unref?.();

export function rateLimiter({ windowMs = 60000, maxRequests = 100, message = 'Too many requests, please try again later.' } = {}) {
  return (req, res, next) => {
    const key = `${req.ip}:${req.baseUrl || req.path}`;
    const now = Date.now();
    let entry = requestCounts.get(key);

    if (!entry || now - entry.windowStart > windowMs) {
      entry = { windowStart: now, count: 0 };
      requestCounts.set(key, entry);
    }

    entry.count++;
    entry.windowMs = windowMs;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - entry.count));
    res.setHeader('X-RateLimit-Reset', new Date(entry.windowStart + windowMs).toISOString());

    if (entry.count > maxRequests) {
      return res.status(429).json({
        success: false,
        error: message,
      });
    }

    next();
  };
}

// Pre-configured limiters
export const authLimiter = rateLimiter({
  windowMs: 60000,
  maxRequests: 10,
  message: 'Too many authentication attempts. Please wait a minute.',
});

export const generalLimiter = rateLimiter({
  windowMs: 60000,
  maxRequests: 100,
  message: 'Too many requests. Please slow down.',
});
