import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../supabaseClient';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { loginSchema } from '../validators';
import { loginRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// POST /api/auth/login — Authenticate user & issue JWT
// Strict rate limit applied: 10 attempts per IP per 15-minute window.
router.post('/login', loginRateLimiter, async (req: Request, res: Response) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.issues.map((e: any) => e.message),
      });
    }

    const { email, password } = parseResult.data;

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, password, role')
      .eq('email', email)
      .single();

    // Use a constant-time comparison path: always run bcrypt.compare even on
    // "user not found" to prevent user-enumeration via timing attacks.
    const dummyHash = '$2a$10$abcdefghijklmnopqrstuvuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu';
    const hashToCompare = user ? user.password : dummyHash;
    const validPassword = await bcrypt.compare(password, hashToCompare);

    if (error || !user || !validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    // JWT_SECRET is guaranteed set — startup guard in index.ts prevents missing secret.
    const jwtSecret = process.env.JWT_SECRET as string;
    const token = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '24h' });

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err: any) {
    // Do not expose internal error details to the client
    console.error('[Auth] Login error:', err.message);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
});

// GET /api/auth/me — Get current logged-in user profile
router.get('/me', authenticateToken, (req: AuthRequest, res: Response) => {
  return res.json({ user: req.user });
});

export default router;
