import bcrypt from 'bcrypt';
import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
	throw new Error('JWT_SECRET environment variable must be set');
}

// Cookie options for JWT
// In production: Secure=true (HTTPS), SameSite=lax (works with Vercel proxy)
// In development: Secure=false (HTTP), SameSite=lax
const getCookieOptions = () => ({
	httpOnly: true, // Not accessible to JavaScript
	secure: process.env.NODE_ENV === 'production',
	sameSite: 'lax' as const, // Works for same-site (proxied) requests
	maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
	path: '/',
});

export const register = async (req: Request, res: Response) => {
	try {
		const { email, username, password } = req.body;

		if (!email || !username || !password) {
			return res.status(400).json({ error: 'Missing required fields' });
		}

		const existingUser = await prisma.user.findUnique({
			where: { email },
		});

		if (existingUser) {
			return res.status(400).json({ error: 'User already exists' });
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		// Find all public channels to add the new user to
		const publicChannels = await prisma.channel.findMany({
			where: { type: 'PUBLIC' },
		});

		const user = await prisma.user.create({
			data: {
				email,
				username,
				password: hashedPassword,
				channels: {
					connect: publicChannels.map((channel) => ({ id: channel.id })),
				},
			},
		});

		const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
			expiresIn: '7d',
		});

		// Set token in HttpOnly cookie
		res.cookie('token', token, getCookieOptions());

		res.status(201).json({
			user: {
				id: user.id,
				email: user.email,
				username: user.username,
				avatar: user.avatar,
			},
		});
	} catch (_error) {
		res.status(500).json({ error: 'Error registering user' });
	}
};

export const login = async (req: Request, res: Response) => {
	console.log(`[Auth] Login attempt for email: ${req.body.email}`);
	try {
		const { email, password } = req.body;

		const user = await prisma.user.findUnique({
			where: { email },
		});

		if (!user) {
			console.log(`[Auth] User not found: ${email}`);
			return res.status(401).json({ error: 'Invalid credentials' });
		}

		const isPasswordValid = await bcrypt.compare(password, user.password);

		if (!isPasswordValid) {
			return res.status(401).json({ error: 'Invalid credentials' });
		}

		const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
			expiresIn: '7d',
		});

		// Set token in HttpOnly cookie
		res.cookie('token', token, getCookieOptions());

		res.json({
			user: {
				id: user.id,
				email: user.email,
				username: user.username,
				avatar: user.avatar,
			},
		});
	} catch (_error) {
		res.status(500).json({ error: 'Error logging in' });
	}
};

export const logout = async (_req: Request, res: Response) => {
	// Clear the token cookie
	res.cookie('token', '', {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 0, // Expire immediately
		path: '/',
	});

	res.json({ message: 'Logged out successfully' });
};
