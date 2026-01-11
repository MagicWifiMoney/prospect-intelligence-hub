import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkUser() {
  const user = await prisma.user.findUnique({
    where: { email: 'test-login-001@example.com' }
  });

  if (!user) {
    console.log('User not found!');
  } else {
    console.log('User found:');
    console.log(JSON.stringify(user, null, 2));

    // Check password
    if (user.password) {
      const isPasswordValid = await bcrypt.compare('SecurePass456!', user.password);
      console.log(`\nPassword valid: ${isPasswordValid}`);
    } else {
      console.log('\nNo password set for user!');
    }
  }

  await prisma.$disconnect();
}

checkUser().catch(console.error);
