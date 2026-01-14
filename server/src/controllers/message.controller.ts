import type { Response } from "express";
import prisma from "../lib/prisma";
import type { AuthRequest } from "../middleware/auth.middleware";

export const getChannelMessages = async (req: AuthRequest, res: Response) => {
	try {
		const channelId = req.params.channelId as string;

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
                savedMessages: {
                    where: { userId: req.userId },
                    select: { id: true }
                }
			},
			orderBy: { createdAt: "asc" },
		});

		res.json(messages.map(m => ({
            ...m,
            isSaved: m.savedMessages.length > 0
        })));
        // Auto-join public channel if not already a member
        const userId = req.userId;
        const channel = await prisma.channel.findUnique({
            where: { id: channelId },
            include: { members: { where: { id: userId } } }
        });

        if (channel && channel.type === "PUBLIC" && channel.members.length === 0) {
            await prisma.channel.update({
                where: { id: channelId },
                data: {
                    members: {
                        connect: { id: userId }
                    }
                }
            });
        }

		res.json(messages);
	} catch (_error) {
		res.status(500).json({ error: "Error fetching messages" });
	}
};

import { broadcastMessage } from "../socket";

export const createMessage = async (req: AuthRequest, res: Response) => {
	try {
		const { content, channelId, tempId } = req.body;
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

        // Ensure user is added to channel members (especially for PUBLIC channels)
        await prisma.channel.update({
            where: { id: channelId },
            data: {
                members: {
                    connect: { id: userId }
                }
            }
        });

		broadcastMessage(channelId, { ...message, tempId });

		res.status(201).json(message);
	} catch (_error) {
		res.status(500).json({ error: "Error sending message" });
	}
};
