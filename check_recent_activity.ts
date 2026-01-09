import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkActivity() {
  console.log('\n=== 📊 RECENT ACTIVITY CHECK ===\n')
  
  const recentProspects = await prisma.prospect.findMany({
    take: 10,
    orderBy: { updatedAt: 'desc' },
    select: {
      companyName: true,
      businessType: true,
      leadScore: true,
      isHotLead: true,
      updatedAt: true,
      lastAnalyzed: true,
    }
  })
  
  console.log('🔄 Top 10 Most Recently Updated Prospects:\n')
  recentProspects.forEach((p, i) => {
    const timeAgo = Math.round((Date.now() - new Date(p.updatedAt).getTime()) / 60000)
    console.log(`${i+1}. ${p.companyName}`)
    console.log(`   Score: ${p.leadScore || 'N/A'} | Updated: ${timeAgo} min ago`)
    console.log('')
  })
  
  console.log('\n✅ Dashboard "Recent Activity" widget will show these 5 prospects')
  console.log('   (The top 5 from the list above)\n')
}

checkActivity()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
