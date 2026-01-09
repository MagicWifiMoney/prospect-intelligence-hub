import { PrismaClient } from '@prisma/client'
import { calculateEnhancedScores, getCategoryLeadValue, BORING_GOLDMINE_TYPES } from '../lib/scoring-enhanced'

const prisma = new PrismaClient()

async function rescoreAllProspects() {
  console.log('\n===========================================')
  console.log('  ENHANCED SCORING - All Prospects')
  console.log('===========================================\n')

  const prospects = await prisma.prospect.findMany()
  console.log(`Found ${prospects.length} prospects to score\n`)

  let updated = 0
  let highTicketCount = 0
  let goldmineCount = 0
  let leadGenOppCount = 0
  let quickWinCount = 0

  const batchSize = 100
  const categoryStats: Record<string, { count: number; avgScore: number; totalLeadValue: number }> = {}

  for (let i = 0; i < prospects.length; i += batchSize) {
    const batch = prospects.slice(i, i + batchSize)

    await Promise.all(
      batch.map(async (prospect) => {
        const scores = calculateEnhancedScores(prospect)

        await prisma.prospect.update({
          where: { id: prospect.id },
          data: {
            highTicketScore: scores.highTicketScore,
            opportunityScore: scores.opportunityScore,
            leadGenScore: scores.leadGenScore,
            scoringFactors: JSON.parse(JSON.stringify(scores.scoringFactors)),
            opportunityTags: scores.opportunityTags,
          },
        })

        updated++

        // Track tag counts
        if (scores.opportunityTags.includes('high_ticket')) highTicketCount++
        if (scores.opportunityTags.includes('boring_goldmine')) goldmineCount++
        if (scores.opportunityTags.includes('leadgen_opportunity')) leadGenOppCount++
        if (scores.opportunityTags.includes('quick_win')) quickWinCount++

        // Track category stats for lead gen opportunities
        const businessType = (prospect.businessType || prospect.categories || 'unknown').toLowerCase()
        const category = BORING_GOLDMINE_TYPES.find(t => businessType.includes(t)) || 'other'

        if (!categoryStats[category]) {
          categoryStats[category] = { count: 0, avgScore: 0, totalLeadValue: 0 }
        }
        categoryStats[category].count++
        categoryStats[category].avgScore += scores.leadGenScore
        categoryStats[category].totalLeadValue += getCategoryLeadValue(businessType)
      })
    )

    const progress = Math.min(i + batchSize, prospects.length)
    console.log(`Progress: ${progress}/${prospects.length} (${Math.round((progress / prospects.length) * 100)}%)`)
  }

  // Calculate averages for category stats
  for (const category of Object.keys(categoryStats)) {
    categoryStats[category].avgScore = Math.round(categoryStats[category].avgScore / categoryStats[category].count)
  }

  console.log('\n===========================================')
  console.log('  SCORING COMPLETE!')
  console.log('===========================================\n')

  console.log(`Total Updated: ${updated} prospects\n`)

  console.log('OPPORTUNITY TAGS BREAKDOWN:')
  console.log(`  High-Ticket Prospects:    ${highTicketCount} (${Math.round((highTicketCount / updated) * 100)}%)`)
  console.log(`  Boring Goldmines:         ${goldmineCount} (${Math.round((goldmineCount / updated) * 100)}%)`)
  console.log(`  Lead Gen Opportunities:   ${leadGenOppCount} (${Math.round((leadGenOppCount / updated) * 100)}%)`)
  console.log(`  Quick Wins:               ${quickWinCount} (${Math.round((quickWinCount / updated) * 100)}%)\n`)

  // Sort categories by lead gen score
  const sortedCategories = Object.entries(categoryStats)
    .filter(([cat]) => cat !== 'other')
    .sort((a, b) => b[1].avgScore - a[1].avgScore)
    .slice(0, 10)

  console.log('TOP 10 LEAD GEN OPPORTUNITIES BY CATEGORY:')
  console.log('-------------------------------------------')
  sortedCategories.forEach(([category, stats], index) => {
    console.log(`${index + 1}. ${category.toUpperCase()}`)
    console.log(`   Prospects: ${stats.count} | Avg Score: ${stats.avgScore} | Est. Lead Value: $${Math.round(stats.totalLeadValue / stats.count)}`)
  })

  // Get top scoring prospects
  const topHighTicket = await prisma.prospect.findMany({
    where: { highTicketScore: { gte: 60 } },
    orderBy: { highTicketScore: 'desc' },
    take: 5,
    select: { companyName: true, businessType: true, city: true, highTicketScore: true },
  })

  const topGoldmines = await prisma.prospect.findMany({
    where: { opportunityTags: { has: 'boring_goldmine' } },
    orderBy: { opportunityScore: 'desc' },
    take: 5,
    select: { companyName: true, businessType: true, city: true, opportunityScore: true, website: true },
  })

  const topLeadGen = await prisma.prospect.findMany({
    where: { leadGenScore: { gte: 65 } },
    orderBy: { leadGenScore: 'desc' },
    take: 5,
    select: { companyName: true, businessType: true, city: true, leadGenScore: true },
  })

  console.log('\n\nTOP 5 HIGH-TICKET PROSPECTS:')
  console.log('----------------------------')
  topHighTicket.forEach((p, i) => {
    console.log(`${i + 1}. ${p.companyName} (${p.businessType}) - ${p.city}`)
    console.log(`   High-Ticket Score: ${p.highTicketScore}`)
  })

  console.log('\n\nTOP 5 BORING GOLDMINES:')
  console.log('-----------------------')
  topGoldmines.forEach((p, i) => {
    console.log(`${i + 1}. ${p.companyName} (${p.businessType}) - ${p.city}`)
    console.log(`   Opportunity Score: ${p.opportunityScore} | Website: ${p.website ? 'Yes' : 'NO - OPPORTUNITY!'}`)
  })

  console.log('\n\nTOP 5 LEAD GEN OPPORTUNITIES:')
  console.log('-----------------------------')
  topLeadGen.forEach((p, i) => {
    console.log(`${i + 1}. ${p.companyName} (${p.businessType}) - ${p.city}`)
    console.log(`   Lead Gen Score: ${p.leadGenScore}`)
  })

  // Create system job record
  await prisma.systemJob.create({
    data: {
      jobType: 'enhanced_scoring',
      status: 'completed',
      result: JSON.stringify({
        updated,
        highTicketCount,
        goldmineCount,
        leadGenOppCount,
        quickWinCount,
        topCategories: sortedCategories.slice(0, 5).map(([cat, stats]) => ({
          category: cat,
          count: stats.count,
          avgScore: stats.avgScore,
        })),
      }),
      completedAt: new Date(),
    },
  })

  console.log('\n\nScoring complete! Refresh your dashboard to see the new data.')
}

rescoreAllProspects()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
