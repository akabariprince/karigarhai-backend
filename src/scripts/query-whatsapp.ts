import { prisma } from '../config/database';
import { WhatsappService } from '../modules/whatsapp/whatsapp.service';

const whatsappService = new WhatsappService();

async function main() {
  console.log('--- CALLING getActiveConversations() ---');
  const conversations = await whatsappService.getActiveConversations();
  console.log('Conversations count:', conversations.length);

  console.log('\n--- FETCHING ALL REGISTERED USERS ---');
  const users = await prisma.user.findMany({
    select: {
      id: true,
      phone: true,
      role: true,
      profile: {
        select: {
          firstName: true,
          lastName: true,
          city: true
        }
      }
    }
  });

  for (const u of users) {
    console.log(`User ID: ${u.id} | Phone: ${u.phone} | Role: ${u.role} | Name: ${u.profile ? `${u.profile.firstName} ${u.profile.lastName || ''}`.trim() : 'N/A'}`);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
