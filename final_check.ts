import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function finalCheck() {
  console.log('\n=== 📊 COLLECTION COMPLETE - FINAL REPORT ===\n')
  
  const total = await prisma.prospect.count()
  console.log(`Total Prospects: ${total} (was 3,740)`)
  console.log(`New Additions: ${total - 3740}`)
  
  const hotLeads = await prisma.prospect.count({ where: { isHotLead: true } })
  console.log(`\nHot Leads: ${hotLeads} (was 1)`)
  console.log(`New Hot Leads: ${hotLeads - 1}`)
  
  const withScores = await prisma.prospect.count({ where: { leadScore: { not: null } } })
  console.log(`\nProspects with Scores: ${withScores} (was 1)`)
  console.log(`Newly Scored: ${withScores - 1}`)
  
  const recentlyUpdated = await prisma.prospect.count({
    where: {
      lastAnalyzed: {
        gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
      }
    }
  })
  console.log(`\nUpdated in last 5 min: ${recentlyUpdated}`)
  
  const topProspects = await prisma.prospect.findMany({
    where: {
      lastAnalyzed: {
        gte: new Date(Date.now() - 5 * 60 * 1000)
      }
    },
    take: 10,
    orderBy: { leadScore: 'desc' },
    select: {
      companyName: true,
      businessType: true,
      leadScore: true,
      googleRating: true,
      reviewCount: true,
      isHotLead: true,
      phone: true,
    }
  })
  
  console.log('\n🔥 Top 10 Newly Added/Updated Prospects:\n')
  topProspects.forEach((p, i) => {
    const hotLead = p.isHotLead ? ' ⭐ HOT LEAD' : ''
    console.log(`${i+1}. ${p.companyName}${hotLead}`)
    console.log(`   Type: ${p.businessType}`)
    console.log(`   Score: ${p.leadScore} | Rating: ${p.googleRating} | Reviews: ${p.reviewCount}`)
    console.log(`   Phone: ${p.phone || 'N/A'}`)
    console.log('')
  })
  
  console.log('✅ Dashboard will now show updated data!')
  console.log('   Refresh /dashboard to see changes\n')
}

finalCheck()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
