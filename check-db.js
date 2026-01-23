
const { PrismaClient } = require('./prisma/generated/client')
const prisma = new PrismaClient()

async function main() {
    const segments = await prisma.icpSegment.findMany()
    console.log('SEGMENTS_COUNT:', segments.length)
    console.log('SEGMENTS:', JSON.stringify(segments, null, 2))

    const offers = await prisma.offerTemplate.findMany()
    console.log('OFFERS_COUNT:', offers.length)
    console.log('OFFERS:', JSON.stringify(offers, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
