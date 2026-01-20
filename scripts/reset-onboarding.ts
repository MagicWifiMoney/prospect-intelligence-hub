
import { PrismaClient } from '../prisma/generated/client'
const prisma = new PrismaClient()

async function main() {
    await prisma.user.update({
        where: { email: 'demo@prospectintel.com' },
        data: { onboardingCompleted: false }
    })
    console.log('Reset onboarding for demo@prospectintel.com')
}

main().finally(() => prisma.$disconnect())
