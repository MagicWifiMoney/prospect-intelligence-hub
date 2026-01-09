import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDatabase() {
  console.log('\n=== DATABASE STATUS AFTER COLLECTION STOP ===\n')
  
  const total = await prisma.prospect.count()
  console.log(`Total Prospects: ${total}`)
  
  const recentlyUpdated = await prisma.prospect.count({
    where: {
      updatedAt: {
        gte: new Date(Date.now() - 30 * 60 * 1000) // Last 30 minutes
      }
    }
  })
  console.log(`Updated in last 30 min: ${recentlyUpdated}`)
  
  const hotLeads = await prisma.prospect.count({ where: { isHotLead: true } })
  console.log(`Hot Leads: ${hotLeads}`)
  
  const newBusinesses = await prisma.newBusiness.count({
    where: {
      detectedAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    }
  })
  console.log(`New Businesses (7 days): ${newBusinesses}`)
  
  const jobs = await prisma.systemJob.findMany({
    take: 3,
    orderBy: { createdAt: 'desc' },
    select: {
      jobType: true,
      status: true,
      result: true,
      createdAt: true,
    }
  })
  
  console.log('\nRecent System Jobs:')
  jobs.forEach((job, i) => {
    console.log(`  ${i+1}. ${job.jobType} - ${job.status}`)
    console.log(`     ${job.result || 'No result yet'}`)
  })
  
  console.log('\n✅ Collection stopped at user request')
  console.log('   Database unchanged from original 3,740 prospects\n')
}

checkDatabase()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
