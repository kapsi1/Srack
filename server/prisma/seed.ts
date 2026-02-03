import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
	// Only seed the demo user in non-production environments
	if (process.env.NODE_ENV !== 'production') {
		const hashedPassword = await bcrypt.hash('password123', 10);

		const user = await prisma.user.upsert({
			where: { username: 'DemoUser' },
			update: {},
			create: {
				username: 'DemoUser',
				password: hashedPassword,
				avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DemoUser',
			},
		});
		console.log('Dummy user created:', user.username);
	} else {
		console.log('Skipping DemoUser creation in production environment.');
	}

	// Create a default channel
	const general = await prisma.channel.upsert({
		where: { id: 'general-channel-id' }, // Just a fixed ID for demo
		update: {},
		create: {
			id: 'general-channel-id',
			name: 'general',
		},
	});

	console.log('Default channel created:', general.name);
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
