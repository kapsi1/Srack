import type { Response } from "express";
import prisma from "../lib/prisma";
import type { AuthRequest } from "../middleware/auth.middleware";

export const getChannelMessages = async (req: AuthRequest, res: Response) => {
	try {
		const { channelId } = req.params;

		const messages = await prisma.message.findMany({
			where: { channelId },
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
			},
			orderBy: { createdAt: "asc" },
		});

		res.json(messages);
	} catch (_error) {
		res.status(500).json({ error: "Error fetching messages" });
	}
};

export const createMessage = async (req: AuthRequest, res: Response) => {
	try {
		const { content, channelId } = req.body;
		const userId = req.userId;

		if (!content || !channelId || !userId) {
			return res.status(400).json({ error: "Missing required fields" });
		}

		const message = await prisma.message.create({
			data: {
				content,
				channelId,
				senderId: userId,
			},
			include: {
				sender: {
					select: {
						id: true,
						username: true,
						avatar: true,
					},
				},
				reactions: true,
			},
		});

		res.status(201).json(message);
	} catch (_error) {
		res.status(500).json({ error: "Error sending message" });
	}
};
