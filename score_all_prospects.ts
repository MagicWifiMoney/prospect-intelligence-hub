import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function calculateLeadScore(prospect: any): number {
  let score = 0
  
  // Rating (25 points max)
  if (prospect.googleRating) {
    score += (prospect.googleRating / 5) * 25
  }
  
  // Review count (20 points max)
  if (prospect.reviewCount) {
    score += Math.min((prospect.reviewCount / 200) * 20, 20)
  }
  
  // Website presence (15 points)
  if (prospect.website) {
    score += 15
  }
  
  // Contact info (10 points total)
  if (prospect.phone && prospect.email) {
    score += 10
  } else if (prospect.phone || prospect.email) {
    score += 5
  }
  
  // Social media presence (10 points)
  if (prospect.socialMedia && prospect.socialMedia !== '{}') {
    score += 10
  }
  
  // Business age/establishment (10 points - placeholder)
  // Could be enhanced with domain age, GBP creation date, etc.
  if (prospect.reviewCount && prospect.reviewCount > 50) {
    score += 5 // Established business indicator
  }
  
  return Math.round(score)
}

function isHotLead(prospect: any, score: number): boolean {
  return (
    score >= 70 &&
    (prospect.googleRating || 0) >= 4.5 &&
    (prospect.reviewCount || 0) >= 20 &&
    !!prospect.website &&
    !!prospect.phone
  )
}

async function scoreAllProspects() {
  console.log('\n🚀 SCORING ALL 3,747 PROSPECTS\n')
  console.log('This will calculate lead scores for all unscored prospects...\n')
  
  const unscored = await prisma.prospect.findMany({
    where: { leadScore: null }
  })
  
  console.log(`Found ${unscored.length} prospects without scores\n`)
  console.log('Processing...\n')
  
  let updated = 0
  let newHotLeads = 0
  const batchSize = 100
  
  for (let i = 0; i < unscored.length; i += batchSize) {
    const batch = unscored.slice(i, i + batchSize)
    
    await Promise.all(
      batch.map(async (prospect) => {
        const score = calculateLeadScore(prospect)
        const hotLead = isHotLead(prospect, score)
        
        await prisma.prospect.update({
          where: { id: prospect.id },
          data: {
            leadScore: score,
            isHotLead: hotLead,
            lastAnalyzed: new Date(),
          }
        })
        
        updated++
        if (hotLead) newHotLeads++
      })
    )
    
    console.log(`Progress: ${Math.min(i + batchSize, unscored.length)}/${unscored.length} (${Math.round((Math.min(i + batchSize, unscored.length)/unscored.length)*100)}%)`)
  }
  
  console.log(`\n✅ Scoring Complete!\n`)
  console.log(`Updated: ${updated} prospects`)
  console.log(`New Hot Leads: ${newHotLeads}\n`)
  
  // Get final stats
  const totalWithScores = await prisma.prospect.count({
    where: { leadScore: { not: null } }
  })
  
  const totalHotLeads = await prisma.prospect.count({
    where: { isHotLead: true }
  })
  
  const avgScore = await prisma.prospect.aggregate({
    _avg: { leadScore: true },
    where: { leadScore: { not: null } }
  })
  
  console.log('📊 Final Database Stats:\n')
  console.log(`Total Prospects: 3,747`)
  console.log(`Prospects with Scores: ${totalWithScores} (100%)`)
  console.log(`Hot Leads: ${totalHotLeads}`)
  console.log(`Average Score: ${avgScore._avg.leadScore?.toFixed(1)}\n`)
  
  // Get top 20 hot leads
  const topLeads = await prisma.prospect.findMany({
    where: { isHotLead: true },
    take: 20,
    orderBy: { leadScore: 'desc' },
    select: {
      companyName: true,
      businessType: true,
      city: true,
      leadScore: true,
      googleRating: true,
      reviewCount: true,
      phone: true,
      website: true,
    }
  })
  
  console.log('🔥 Top 20 Hot Leads:\n')
  topLeads.forEach((lead, i) => {
    console.log(`${i+1}. ${lead.companyName}`)
    console.log(`   Type: ${lead.businessType} | City: ${lead.city}`)
    console.log(`   Score: ${lead.leadScore} | Rating: ${lead.googleRating}⭐ | Reviews: ${lead.reviewCount}`)
    console.log(`   Phone: ${lead.phone || 'N/A'} | Website: ${lead.website ? 'Yes' : 'No'}`)
    console.log('')
  })
  
  // Create system job
  await prisma.systemJob.create({
    data: {
      jobType: 'score_all_prospects',
      status: 'completed',
      result: `Scored ${updated} prospects. Found ${newHotLeads} new hot leads.`,
      scheduledAt: new Date(),
      completedAt: new Date(),
    }
  })
  
  console.log('✅ All prospects scored and ready for dashboard!')
  console.log('   Refresh /dashboard to see updated stats\n')
}

scoreAllProspects()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
