import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      username: 'DemoUser',
      password: hashedPassword,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DemoUser',
    },
  });

  console.log('Dummy user created:', user.email);

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
