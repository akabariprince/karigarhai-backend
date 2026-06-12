import { prisma } from '../config/database';

async function main() {
  console.log('--- INSPECTING MESSAGES ---');
  const messages = await prisma.whatsAppMessage.findMany({
    orderBy: { timestamp: 'desc' }
  });
  
  for (const m of messages) {
    console.log(`ID: ${m.id} | Phone: ${m.phoneNumber} | Dir: ${m.direction} | isRead: ${m.isRead} | Content: "${m.content}"`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
