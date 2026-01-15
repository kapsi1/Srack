import request from 'supertest';
import { app } from '../src/app';
import prisma from '../src/lib/prisma';

export const TEST_PREFIX = 'test__';

export const getAuthToken = async () => {
	const uniqueSuffix = Date.now() + Math.floor(Math.random() * 1000);
	const user = {
		username: `${TEST_PREFIX}helper_${uniqueSuffix}`,
		email: `${TEST_PREFIX}helper_${uniqueSuffix}@example.com`,
		password: 'password123',
	};

	const res = await request(app).post('/api/auth/register').send(user);

	return res.body.token;
};

export const cleanupTestData = async () => {
	// Order matters due to foreign key constraints
	// Delete reactions first if they exist (though not directly tested yet)
	await prisma.reaction.deleteMany({
		where: {
			OR: [{ user: { username: { startsWith: TEST_PREFIX } } }, { message: { content: { startsWith: TEST_PREFIX } } }],
		},
	});

	// Delete messages
	await prisma.message.deleteMany({
		where: {
			OR: [
				{ content: { startsWith: TEST_PREFIX } },
				{ sender: { username: { startsWith: TEST_PREFIX } } },
				{ channel: { name: { startsWith: TEST_PREFIX } } },
			],
		},
	});

	// Delete channels (including DMs if their name starts with the prefix)
	await prisma.channel.deleteMany({
		where: {
			name: { startsWith: TEST_PREFIX },
		},
	});

	// Delete users
	await prisma.user.deleteMany({
		where: {
			OR: [{ username: { startsWith: TEST_PREFIX } }, { email: { startsWith: TEST_PREFIX } }],
		},
	});
};
