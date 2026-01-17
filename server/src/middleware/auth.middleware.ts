import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
	throw new Error('JWT_SECRET environment variable must be set');
}

export interface AuthRequest extends Request {
	userId?: string;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
	// Try to get token from HttpOnly cookie first, then fallback to Authorization header
	let token: string | undefined;

	// Check cookie first (primary method)
	if (req.cookies?.token) {
		token = req.cookies.token;
	}
	// Fallback to Authorization header (for backwards compatibility)
	else if (req.headers.authorization?.startsWith('Bearer ')) {
		token = req.headers.authorization.split(' ')[1];
	}

	if (!token) {
		return res.status(401).json({ error: 'Unauthorized' });
	}

	try {
		const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
		req.userId = payload.userId;
		next();
	} catch (_error) {
		res.status(401).json({ error: 'Invalid or expired token' });
	}
};
