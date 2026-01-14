
import type { Response } from "express";
import prisma from "../lib/prisma";
import type { AuthRequest } from "../middleware/auth.middleware";

export const getUserActivity = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { username: true }
        });

        if (!currentUser) {
            return res.status(404).json({ error: "User not found" });
        }

        // Fetch Mentions
        // Note: This matches any message containing @username. 
        // Ideally we'd have a stronger mention system (db relation), but string matching is what we have.
        const mentions = await prisma.message.findMany({
            where: {
                content: {
                    contains: `@${currentUser.username}`
                }
            },
            include: {
                sender: { select: { id: true, username: true, avatar: true } },
                channel: { select: { id: true, name: true, type: true } },
                reactions: {
                    include: {
                        user: { select: { username: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        // Fetch Reactions on user's messages
        // distinct reaction events
        const reactions = await prisma.reaction.findMany({
            where: {
                message: {
                    senderId: userId
                },
                userId: { not: userId } // exclude self-reactions if desired, or keep them
            },
            include: {
                user: { select: { id: true, username: true, avatar: true } }, // The reactor
                message: {
                    include: {
                        sender: { select: { id: true, username: true, avatar: true } }, // Should be current user
                        channel: { select: { id: true, name: true, type: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        // Normalize and merge
        const activity = [
            ...mentions.map(m => ({
                type: 'mention',
                id: m.id,
                createdAt: m.createdAt,
                data: m
            })),
            ...reactions.map(r => ({
                type: 'reaction',
                id: r.id,
                createdAt: r.createdAt,
                data: r
            }))
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 50);

        res.json(activity);

    } catch (error) {
        console.error("Error fetching activity:", error);
        res.status(500).json({ error: "Error fetching activity" });
    }
};
