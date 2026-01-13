import type { Response } from "express";
import prisma from "../lib/prisma";
import type { AuthRequest } from "../middleware/auth.middleware";

export const getChannels = async (_req: AuthRequest, res: Response) => {
	try {
		const channels = await prisma.channel.findMany({
			orderBy: { name: "asc" },
		});
		res.json(channels);
	} catch (_error) {
		res.status(500).json({ error: "Error fetching channels" });
	}
};

export const createChannel = async (req: AuthRequest, res: Response) => {
	try {
		const { name, isPrivate } = req.body;

		if (!name) {
			return res.status(400).json({ error: "Channel name is required" });
		}

		const channel = await prisma.channel.create({
			data: {
				name,
				isPrivate: isPrivate || false,
			},
		});

		res.status(201).json(channel);
	} catch (_error) {
		res.status(500).json({ error: "Error creating channel" });
	}
};
