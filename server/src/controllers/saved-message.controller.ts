import type { Response } from 'express';
import prisma from '../lib/prisma';
import type { AuthRequest } from '../middleware/auth.middleware';

export const toggleSavedMessage = async (req: AuthRequest, res: Response) => {
	try {
		const userId = req.userId;
		const { messageId } = req.body;

		if (!userId || !messageId) {
			return res.status(400).json({ error: 'Missing required fields' });
		}

		const existing = await prisma.savedMessage.findUnique({
			where: {
				userId_messageId: {
					userId,
					messageId,
				},
			},
		});

		if (existing) {
			await prisma.savedMessage.delete({
				where: {
					id: existing.id,
				},
			});
			return res.json({ saved: false });
		}

		await prisma.savedMessage.create({
			data: {
				userId,
				messageId,
			},
		});
		return res.json({ saved: true });
	} catch (error) {
		console.error('Error toggling saved message:', error);
		res.status(500).json({ error: 'Error toggling saved message' });
	}
};

export const getSavedMessages = async (req: AuthRequest, res: Response) => {
	try {
		const userId = req.userId;

		if (!userId) {
			return res.status(401).json({ error: 'Unauthorized' });
		}

		const savedMessages = await prisma.savedMessage.findMany({
			where: { userId },
			include: {
				message: {
					include: {
						sender: {
							select: {
								id: true,
								username: true,
								avatar: true,
							},
						},
						reactions: {
							include: {
								user: {
									select: {
										username: true,
									},
								},
							},
						},
						channel: {
							select: {
								id: true,
								name: true,
							},
						},
					},
				},
			},
			orderBy: { createdAt: 'desc' },
		});

		res.json(
			savedMessages.map((sm) => ({
				...sm.message,
				isSaved: true,
			})),
		);
	} catch (error) {
		console.error('Error fetching saved messages:', error);
		res.status(500).json({ error: 'Error fetching saved messages' });
	}
};
