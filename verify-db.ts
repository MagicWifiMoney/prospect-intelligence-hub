import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyDatabase() {
  console.log('Verifying test users in database...\n')

  const testUsers = await prisma.user.findMany({
    where: {
      email: {
        in: [
          'test-automation-001@example.com',
          'test-login-001@example.com',
        ],
      },
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      name: true,
      role: true,
      password: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  console.log('Found test users:', testUsers.length)
  console.log('\n' + '='.repeat(80))

  testUsers.forEach((user, index) => {
    console.log(`\nTest User ${index + 1}:`)
    console.log(`  ID: ${user.id}`)
    console.log(`  Email: ${user.email}`)
    console.log(`  First Name: ${user.firstName}`)
    console.log(`  Last Name: ${user.lastName}`)
    console.log(`  Full Name: ${user.name}`)
    console.log(`  Role: ${user.role}`)
    console.log(`  Password Hash: ${user.password?.substring(0, 20)}...`)
    console.log(`  Password Algorithm: ${user.password?.startsWith('$2a$') ? 'bcrypt ($2a$)' : user.password?.startsWith('$2b$') ? 'bcrypt ($2b$)' : 'unknown'}`)
    console.log(`  Created At: ${user.createdAt}`)
    console.log(`  Updated At: ${user.updatedAt}`)
  })

  console.log('\n' + '='.repeat(80))
  console.log('Database verification complete!')

  await prisma.$disconnect()
}

verifyDatabase().catch(console.error)
