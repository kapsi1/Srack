import prisma from '../src/lib/prisma';

const TEST_PREFIX = 'test__';
const LEGACY_PREFIXES = ['testuser_', 'loginuser_', 'msg_user_', 'helper_user_', 'test-channel-'];

async function main() {
  const allPrefixes = [TEST_PREFIX, ...LEGACY_PREFIXES];
  console.log('Cleaning up test data with prefixes:', allPrefixes);

  try {
    // 1. Find all users that match the prefixes
    const testUsers = await prisma.user.findMany({
      where: {
        OR: allPrefixes.flatMap(p => [
          { username: { startsWith: p } },
          { email: { startsWith: p } }
        ])
      },
      select: { id: true }
    });
    const testUserIds = testUsers.map(u => u.id);
    console.log(`Found ${testUserIds.length} test users.`);

    // 2. Find all channels that match the prefixes OR are DMs involving test users
    // (We don't want to delete "general" even if a test user joined it)
    const testChannels = await prisma.channel.findMany({
      where: {
        OR: [
          ...allPrefixes.map(p => ({ name: { startsWith: p } })),
          { 
            AND: [
              { type: 'DM' },
              { members: { some: { id: { in: testUserIds } } } }
            ]
          }
        ]
      },
      select: { id: true }
    });
    const testChannelIds = testChannels.map(c => c.id);
    console.log(`Found ${testChannelIds.length} test channels.`);

    // 3. Delete Reactions related to test users or test messages (in test channels or by test users)
    const reactions = await prisma.reaction.deleteMany({
      where: {
        OR: [
          { userId: { in: testUserIds } },
          { message: { senderId: { in: testUserIds } } },
          { message: { channelId: { in: testChannelIds } } }
        ]
      }
    });

    // 4. Delete Messages related to test users or test channels
    const messages = await prisma.message.deleteMany({
      where: {
        OR: [
          { senderId: { in: testUserIds } },
          { channelId: { in: testChannelIds } },
          // Also catch any messages with test prefixes in content just in case
          ...allPrefixes.map(p => ({ content: { startsWith: p } }))
        ]
      }
    });

    // 5. Delete Test Channels
    const deletedChannels = await prisma.channel.deleteMany({
      where: { id: { in: testChannelIds } }
    });

    // 6. Delete Test Users
    const deletedUsers = await prisma.user.deleteMany({
      where: { id: { in: testUserIds } }
    });

    console.log(`Cleanup complete: ${reactions.count} reactions, ${messages.count} messages, ${deletedChannels.count} channels, ${deletedUsers.count} users deleted.`);

  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
