import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const phoneArg = args.find(a => a.startsWith('--phone='));
  const passwordArg = args.find(a => a.startsWith('--password='));

  let phone = phoneArg ? phoneArg.split('=')[1] : null;
  let password = passwordArg ? passwordArg.split('=')[1] : null;

  if (!phone) {
    console.error('Error: Please specify a phone number using --phone=+91XXXXXXXXXX');
    process.exit(1);
  }

  if (!password) {
    // Generate a random 12-character alphanumeric password
    password = crypto.randomBytes(6).toString('hex');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Upsert user
  const user = await prisma.user.upsert({
    where: { phone },
    create: {
      phone,
      role: 'ADMIN',
      isPhoneVerified: true,
      isProfileComplete: true,
      passwordHash: hashedPassword,
    },
    update: {
      role: 'ADMIN',
      passwordHash: hashedPassword,
    },
  });

  // Ensure Admin Profile exists
  await prisma.profile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      firstName: 'System',
      lastName: 'Admin',
      city: 'System',
      state: 'India',
      pincode: '000000',
    },
    update: {},
  });

  console.log('\n=============================================');
  console.log('         ADMIN USER CREATED SUCCESSFULLY     ');
  console.log('=============================================');
  console.log(`Phone:      ${phone}`);
  console.log(`Password:   ${password}`);
  console.log('=============================================\n');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
