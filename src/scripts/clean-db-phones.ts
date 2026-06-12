import { prisma } from '../config/database';

async function main() {
  console.log('--- DB CLEANUP: WHATSAPP PHONE NUMBERS ---');

  const allMessages = await prisma.whatsAppMessage.findMany();
  console.log(`Total messages in DB: ${allMessages.length}`);
  
  for (const msg of allMessages) {
    console.log(`ID: ${msg.id} | Phone: "${msg.phoneNumber}" | Length: ${msg.phoneNumber.length} | Hex: ${Buffer.from(msg.phoneNumber).toString('hex')}`);
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
