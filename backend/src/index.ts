import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';

import authRoutes from './routes/auth';
import customerRoutes from './routes/customers';
import productRoutes from './routes/products';
import challanRoutes from './routes/challans';
import { apiRateLimiter, writeRateLimiter } from './middleware/rateLimiter';

dotenv.config();

// ── Guard: refuse to start without a real JWT secret ─────────────────────────
if (!process.env.JWT_SECRET) {
  console.error('❌ FATAL: JWT_SECRET environment variable is not set. Refusing to start.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// ── Allowed CORS origins ──────────────────────────────────────────────────────
// Add your deployed frontend URL in .env as ALLOWED_ORIGINS (comma-separated).
// Falls back to localhost for local development.
const rawOrigins = process.env.ALLOWED_ORIGINS || '';
const allowedOrigins: string[] = [
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5500', // VS Code Live Server default
  'http://localhost:5500',
  ...rawOrigins
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
];

// ── Security Middleware ───────────────────────────────────────────────────────

// 1. Helmet — sets 14 security-related HTTP response headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow frontend assets
    contentSecurityPolicy: false, // CSP managed by frontend; disable server-side for API
  })
);

// 2. CORS — whitelist only known origins; block everything else
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS: Origin '${origin}' is not allowed`));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// 3. Body size cap — rejects payloads larger than 10 KB (payload bomb / memory exhaustion)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 4. API-wide rate limiter — 200 req / 15 min per IP across all /api/* routes
app.use('/api', apiRateLimiter);

// 5. Write operation rate limiter — 30 mutations / 1 min per IP
app.use('/api', writeRateLimiter);

// ── Static Frontend ───────────────────────────────────────────────────────────
const frontendPath = path.join(__dirname, '../../frontend');
app.use(express.static(frontendPath));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/challans', challanRoutes);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Mini ERP + CRM Operations Portal API',
  });
});

// ── Frontend Catch-All ────────────────────────────────────────────────────────
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ── Global 404 Handler ────────────────────────────────────────────────────────
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Route '${req.method} ${req.path}' not found` });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
// Catches unhandled errors and prevents raw stack traces leaking to clients.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // CORS errors get a 403
  if (err.message.startsWith('CORS:')) {
    return res.status(403).json({ error: err.message });
  }
  // Body parse errors (payload too large, malformed JSON)
  if ((err as any).type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body too large. Maximum allowed size is 10 KB.' });
  }
  if ((err as any).type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body.' });
  }
  // Generic fallback — log internally, return safe message
  console.error('[Server Error]', err.message);
  return res.status(500).json({ error: 'An internal server error occurred.' });
});

// ── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Mini ERP Backend & Portal running on http://localhost:${PORT}`);
  console.log(`🔒 Security: helmet ✓ | rate limiting ✓ | CORS whitelist ✓ | 10 KB body cap ✓`);
});
