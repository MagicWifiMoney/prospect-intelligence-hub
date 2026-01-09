import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const prospectCount = await prisma.prospect.count()
    const latestProspects = await prisma.prospect.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
            companyName: true,
            businessType: true,
            city: true,
            createdAt: true
        }
    })

    console.log(`Total Prospects: ${prospectCount}`)
    if (prospectCount > 0) {
        console.log('Latest 5 Prospects:')
        console.table(latestProspects)
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
