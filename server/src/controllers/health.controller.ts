import type { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getHealth = async (_req: Request, res: Response) => {
	try {
		const startTime = Date.now();
		await prisma.$queryRaw`SELECT 1`;
		const dbResponseTime = Date.now() - startTime;

		res.json({
			status: 'ok',
			timestamp: new Date().toISOString(),
			uptime: process.uptime(),
			database: {
				status: 'connected',
				responseTimeMs: dbResponseTime,
			},
			version: process.env.npm_package_version || '1.0.0',
		});
	} catch (error) {
		res.status(500).json({
			status: 'error',
			timestamp: new Date().toISOString(),
			database: {
				status: 'disconnected',
				error: error instanceof Error ? error.message : String(error),
			},
		});
	}
};
