/**
 * Input sanitization middleware.
 * Trims strings and strips HTML tags from request body fields to prevent XSS.
 */
const HTML_TAG_REGEX = /<[^>]+>/g;

function sanitizeValue(value) {
  if (typeof value === 'string') {
    return value.replace(HTML_TAG_REGEX, '').trim();
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === 'object') {
    return sanitizeObject(value);
  }
  return value;
}

function sanitizeObject(obj) {
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeValue(value);
  }
  return sanitized;
}

export function sanitize(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    // Don't sanitize the 'code' field — it contains legitimate code with angle brackets
    const { code, ...rest } = req.body;
    const sanitized = sanitizeObject(rest);
    if (code !== undefined) sanitized.code = code;
    req.body = sanitized;
  }
  next();
}
