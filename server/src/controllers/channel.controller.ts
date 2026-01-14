import type { Response } from "express";
import prisma from "../lib/prisma";
import type { AuthRequest } from "../middleware/auth.middleware";

export const getChannels = async (req: AuthRequest, res: Response) => {
	try {
		const userId = req.userId;

		const channels = await prisma.channel.findMany({
			where: {
				OR: [
					{ type: "PUBLIC" },
					{
						members: {
							some: {
								id: userId,
							},
						},
					},
				],
			},
			orderBy: { name: "asc" },
			include: {
				members: {
					select: {
						id: true,
						username: true,
						avatar: true,
					},
				},
			},
		});
		res.json(channels);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Error fetching channels" });
	}
};

export const createChannel = async (req: AuthRequest, res: Response) => {
	try {
		const { name, isPrivate, description } = req.body;
		const userId = req.userId;

		if (!name) {
			return res.status(400).json({ error: "Channel name is required" });
		}

		const channel = await prisma.channel.create({
			data: {
				name,
				description: description || null,
				isPrivate: isPrivate || false,
				type: isPrivate ? "PRIVATE" : "PUBLIC",
				members: {
					connect: { id: userId }, // Creator is always a member
				},
			},
		});

		res.status(201).json(channel);
	} catch (error) {
		console.error("Error creating channel:", error);
		res.status(500).json({ error: "Error creating channel" });
	}
};

export const createDM = async (req: AuthRequest, res: Response) => {
	try {
		const { targetUserId } = req.body;
		const userId = req.userId;

		if (!targetUserId) {
			return res.status(400).json({ error: "Target user ID is required" });
		}

		// Check for existing DM
		const existingDM = await prisma.channel.findFirst({
			where: {
				type: "DM",
				AND: [
					{ members: { some: { id: userId } } },
					{ members: { some: { id: targetUserId } } },
				],
			},
			include: {
				members: {
					select: {
						id: true,
						username: true,
						avatar: true,
					},
				},
			},
		});

		if (existingDM) {
			return res.json(existingDM);
		}

		// Create new DM
		// DM name isn't strictly used for display (we show the other user's name), but let's make it unique-ish
		const newDM = await prisma.channel.create({
			data: {
				name: `dm-${Date.now()}`,
				type: "DM",
				isPrivate: true,
				members: {
					connect: [{ id: userId }, { id: targetUserId }],
				},
			},
			include: {
				members: {
					select: {
						id: true,
						username: true,
						avatar: true,
					},
				},
			},
		});

		res.status(201).json(newDM);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Error creating DM" });
	}
};
