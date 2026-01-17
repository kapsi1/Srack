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
	
	const cookies = res.headers['set-cookie'] as unknown as string[];
	if (!cookies) {
		throw new Error('No cookies set after registration');
	}

	const tokenCookie = cookies.find((c: string) => c.startsWith('token='));
	if (!tokenCookie) {
		throw new Error('Token cookie not found');
	}

	// Extract token value: token=...; Path=/; ...
	const token = tokenCookie.split(';')[0].split('=')[1];
	return token;
};

export const cleanupTestData = async () => {
	// 1. Find all users with TEST_PREFIX
	const testUsers = await prisma.user.findMany({
		where: {
			OR: [{ username: { startsWith: TEST_PREFIX } }, { email: { startsWith: TEST_PREFIX } }],
		},
		select: { id: true },
	});
	const testUserIds = testUsers.map((u) => u.id);

	// 2. Find all channels with TEST_PREFIX or DMs involving test users
	const testChannels = await prisma.channel.findMany({
		where: {
			OR: [
				{ name: { startsWith: TEST_PREFIX } },
				{ AND: [{ type: 'DM' }, { members: { some: { id: { in: testUserIds } } } }] },
			],
		},
		select: { id: true },
	});
	const testChannelIds = testChannels.map((c) => c.id);

	// Order matters due to foreign key constraints

	// 3. Delete StarredChannel
	await prisma.starredChannel.deleteMany({
		where: {
			OR: [{ userId: { in: testUserIds } }, { channelId: { in: testChannelIds } }],
		},
	});

	// 4. Delete SavedMessage
	await prisma.savedMessage.deleteMany({
		where: {
			OR: [
				{ userId: { in: testUserIds } },
				{ message: { channelId: { in: testChannelIds } } },
				{ message: { senderId: { in: testUserIds } } },
			],
		},
	});

	// 5. Delete Reaction
	await prisma.reaction.deleteMany({
		where: {
			OR: [
				{ userId: { in: testUserIds } },
				{ message: { channelId: { in: testChannelIds } } },
				{ message: { senderId: { in: testUserIds } } },
			],
		},
	});

	// 6. Delete Message (including replies)
	// First delete all replies (messages with parentId) to avoid self-relation constraints
	await prisma.message.deleteMany({
		where: {
			AND: [
				{ parentId: { not: null } },
				{
					OR: [{ senderId: { in: testUserIds } }, { channelId: { in: testChannelIds } }],
				},
			],
		},
	});

	// Then delete root messages
	await prisma.message.deleteMany({
		where: {
			OR: [{ senderId: { in: testUserIds } }, { channelId: { in: testChannelIds } }],
		},
	});

	// 7. Delete Channel
	await prisma.channel.deleteMany({
		where: { id: { in: testChannelIds } },
	});

	// 8. Delete ClientLog
	await prisma.clientLog.deleteMany({
		where: { userId: { in: testUserIds } },
	});

	// 9. Delete User
	await prisma.user.deleteMany({
		where: { id: { in: testUserIds } },
	});
};
