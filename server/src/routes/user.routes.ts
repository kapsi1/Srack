import { type Response, Router } from 'express';
import prisma from '../lib/prisma';
import { type AuthRequest, authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
	try {
		const user = await prisma.user.findUnique({
			where: { id: req.userId },
			select: {
				id: true,
				email: true,
				username: true,
				avatar: true,
				createdAt: true,
			},
		});

		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}

		res.json(user);
	} catch (_error) {
		res.status(500).json({ error: 'Error fetching user profile' });
	}
});

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
	try {
		const users = await prisma.user.findMany({
			where: {
				id: { not: req.userId },
			},
			select: {
				id: true,
				username: true,
				avatar: true,
			},
			orderBy: { username: 'asc' },
		});

		res.json(users);
	} catch (_error) {
		res.status(500).json({ error: 'Error fetching users' });
	}
});

export default router;
