import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkScoringStatus() {
  console.log('\n=== 🔍 LEAD SCORING STATUS ANALYSIS ===\n')
  
  const total = await prisma.prospect.count()
  console.log(`Total Prospects in Database: ${total}\n`)
  
  const withScores = await prisma.prospect.count({
    where: { leadScore: { not: null } }
  })
  
  const withoutScores = await prisma.prospect.count({
    where: { leadScore: null }
  })
  
  console.log('📊 Scoring Breakdown:')
  console.log(`   ✅ WITH Lead Scores: ${withScores} (${((withScores/total)*100).toFixed(1)}%)`)
  console.log(`   ❌ WITHOUT Lead Scores: ${withoutScores} (${((withoutScores/total)*100).toFixed(1)}%)\n`)
  
  console.log('🎯 What This Means:')
  console.log(`   • Original CSV import added ${total - 7} prospects`)
  console.log(`   • CSV import did NOT calculate lead scores`)
  console.log(`   • Only the 50 recently scraped prospects have scores`)
  console.log(`   • ${withoutScores} prospects are "unscored"\n`)
  
  // Check what data the unscored prospects have
  const sampleUnscored = await prisma.prospect.findMany({
    where: { leadScore: null },
    take: 10,
    select: {
      companyName: true,
      businessType: true,
      googleRating: true,
      reviewCount: true,
      website: true,
      phone: true,
      email: true,
    }
  })
  
  console.log('📋 Sample of Unscored Prospects (first 10):\n')
  sampleUnscored.forEach((p, i) => {
    console.log(`${i+1}. ${p.companyName}`)
    console.log(`   Type: ${p.businessType}`)
    console.log(`   Rating: ${p.googleRating || 'N/A'} | Reviews: ${p.reviewCount}`)
    console.log(`   Website: ${p.website ? 'Yes' : 'No'} | Phone: ${p.phone ? 'Yes' : 'No'}`)
    console.log('')
  })
  
  console.log('💡 Key Insight:')
  console.log('   The original 3,740 prospects have raw data (name, type, city)')
  console.log('   BUT they were never processed through the lead scoring algorithm')
  console.log('   Only the 50 recently scraped prospects got scored\n')
  
  console.log('✅ Solution Options:')
  console.log('   1. Score ALL 3,747 prospects using existing data')
  console.log('   2. Run full collection to enrich & score all records')
  console.log('   3. Keep as-is (51 scored, rest unscored)\n')
}

checkScoringStatus()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
