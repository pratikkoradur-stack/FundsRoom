import rateLimit from 'express-rate-limit';

// ── Helper: formats the Retry-After time in a human-readable way ──────────────
const retryMessage = (windowMs: number) => {
  const minutes = Math.ceil(windowMs / 60_000);
  return `Too many requests. Please try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`;
};

// ── 1. Login brute-force limiter ──────────────────────────────────────────────
// 10 login attempts per IP per 15-minute window.
// Protects against credential stuffing and password brute-force attacks.
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,  // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,
  message: { error: retryMessage(15 * 60 * 1000) },
  skipSuccessfulRequests: false,
});

// ── 2. General API limiter ────────────────────────────────────────────────────
// 200 requests per IP per 15-minute window across all /api/* routes.
// Prevents scraping, DDoS floods, and Supabase read cost abuse.
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: retryMessage(15 * 60 * 1000) },
});

// ── 3. Write operation limiter ────────────────────────────────────────────────
// 30 POST/PUT/DELETE requests per IP per 1-minute window.
// Prevents bulk-insert spam, mass data mutations, and storage abuse.
export const writeRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many write requests. Please slow down and try again in 1 minute.' },
  skip: (req) => req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS',
});
