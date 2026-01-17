import type { Response } from 'express';
import prisma from '../lib/prisma';
import type { AuthRequest } from '../middleware/auth.middleware';

export const createLog = async (req: AuthRequest, res: Response) => {
	try {
		const { level, message, details } = req.body;
		const userId = req.userId; // Use authenticated userId

		const log = await prisma.clientLog.create({
			data: {
				level,
				message,
				details: details || {},
				userId,
			},
		});

		res.status(201).json(log);
	} catch (error) {
		console.error('Error creating client log:', error);
		res.status(500).json({ error: 'Failed to create log' });
	}
};
