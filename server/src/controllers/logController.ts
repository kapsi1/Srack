import type { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const createLog = async (req: Request, res: Response) => {
	try {
		const { level, message, details, userId } = req.body;

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
