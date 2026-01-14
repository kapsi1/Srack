import type { Response } from "express";
import prisma from "../lib/prisma";
import type { AuthRequest } from "../middleware/auth.middleware";

export const getChannelMessages = async (req: AuthRequest, res: Response) => {
	try {
		const channelId = req.params.channelId as string;

		const messages = await prisma.message.findMany({
			where: { channelId, parentId: null },
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
                },
                _count: {
                    select: { replies: true }
                }
			},
			orderBy: { createdAt: "asc" },
		});

		res.json(messages.map(m => ({
            ...m,
            isSaved: m.savedMessages.length > 0,
            threadCount: m._count.replies
        })));
        
        // Auto-join public channel if not already a member
        const userId = req.userId;
        // Optimization: Run this in background, don't await blocking response? 
        // Or just let it run. But we already sent response.
        // To be safe, we should await before sending response or just ignore.
        // Actually, if we sent response, we can't send error if this fails.
        // Let's move response to end, or just remove the second send.
        
        try {
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
        } catch (e) {
            console.error("Auto-join failed", e);
        }
	} catch (_error) {
		res.status(500).json({ error: "Error fetching messages" });
	}
};

import { broadcastMessage } from "../socket";

export const createMessage = async (req: AuthRequest, res: Response) => {
	try {
		const { content, channelId, tempId, parentId } = req.body;
		const userId = req.userId;

		if (!content || !channelId || !userId) {
			return res.status(400).json({ error: "Missing required fields" });
		}

		const message = await prisma.message.create({
			data: {
				content,
				channelId,
				senderId: userId,
                parentId
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

		broadcastMessage(channelId, { ...message, tempId, threadCount: 0 }); // New message has 0 replies initially

		res.status(201).json(message);
	} catch (_error) {
		res.status(500).json({ error: "Error sending message" });
	}
};

export const getThreadMessages = async (req: AuthRequest, res: Response) => {
	try {
		const messageId = req.params.messageId as string;

		// Fetch parent message first to return it (optional, but good for context)
		// Or just fetch replies. Let's fetch replies.
		const messages = await prisma.message.findMany({
			where: { parentId: messageId },
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
                },
                _count: {
                    select: { replies: true }
                }
			},
			orderBy: { createdAt: "asc" },
		});

		res.json(messages.map(m => ({
            ...m,
            isSaved: m.savedMessages.length > 0,
            threadCount: m._count.replies
        })));
	} catch (_error) {
		res.status(500).json({ error: "Error fetching thread messages" });
	}
};
