import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, register } from '../controllers/auth.controller';

const router = Router();

// Rate limiting for auth endpoints to prevent brute force attacks
const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 10, // 10 attempts per window
	message: { error: 'Too many login attempts, please try again later' },
	standardHeaders: true,
	legacyHeaders: false,
});

const registerLimiter = rateLimit({
	windowMs: 60 * 60 * 1000, // 1 hour
	max: 5, // 5 registrations per hour
	message: { error: 'Too many registration attempts, please try again later' },
	standardHeaders: true,
	legacyHeaders: false,
});

router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, login);

export default router;
