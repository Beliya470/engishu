const rateLimit = {};

// Simple in-memory rate limiter (per IP)
function rateLimiter(maxRequests = 100, windowMs = 60000) {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    if (!rateLimit[ip]) rateLimit[ip] = { count: 0, resetTime: now + windowMs };

    if (now > rateLimit[ip].resetTime) {
      rateLimit[ip] = { count: 0, resetTime: now + windowMs };
    }

    rateLimit[ip].count++;
    if (rateLimit[ip].count > maxRequests) {
      return res.status(429).json({ error: 'Too many requests, please try again later' });
    }
    next();
  };
}

// Stricter rate limit for auth endpoints
function authRateLimiter() {
  return rateLimiter(50, 60000); // 50 attempts per minute (relaxed for dev)
}

// Security headers
function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.removeHeader('X-Powered-By');
  next();
}

// Clean up rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const ip in rateLimit) {
    if (now > rateLimit[ip].resetTime) delete rateLimit[ip];
  }
}, 300000);

module.exports = { rateLimiter, authRateLimiter, securityHeaders };
