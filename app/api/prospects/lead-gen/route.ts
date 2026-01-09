import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { LEAD_VALUE_BY_CATEGORY, BORING_GOLDMINE_TYPES } from '@/lib/scoring-enhanced'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all prospects with lead gen scores
    const prospects = await prisma.prospect.findMany({
      where: {
        leadGenScore: { not: null },
      },
      select: {
        id: true,
        businessType: true,
        categories: true,
        city: true,
        leadGenScore: true,
        website: true,
        googleRating: true,
        reviewCount: true,
      },
    })

    // Aggregate by category and city
    const categoryStats: Record<string, {
      category: string
      count: number
      avgScore: number
      totalScore: number
      avgRating: number
      totalRating: number
      ratingCount: number
      estimatedLeadValue: number
      cities: Record<string, number>
      noWebsiteCount: number
    }> = {}

    for (const prospect of prospects) {
      const businessType = (prospect.businessType || prospect.categories || '').toLowerCase()
      const category = BORING_GOLDMINE_TYPES.find(t => businessType.includes(t)) || 'other'
      const city = prospect.city || 'Unknown'

      if (!categoryStats[category]) {
        categoryStats[category] = {
          category,
          count: 0,
          avgScore: 0,
          totalScore: 0,
          avgRating: 0,
          totalRating: 0,
          ratingCount: 0,
          estimatedLeadValue: LEAD_VALUE_BY_CATEGORY[category] || LEAD_VALUE_BY_CATEGORY['default'],
          cities: {},
          noWebsiteCount: 0,
        }
      }

      categoryStats[category].count++
      categoryStats[category].totalScore += prospect.leadGenScore || 0

      if (prospect.googleRating) {
        categoryStats[category].totalRating += prospect.googleRating
        categoryStats[category].ratingCount++
      }

      if (!prospect.website) {
        categoryStats[category].noWebsiteCount++
      }

      categoryStats[category].cities[city] = (categoryStats[category].cities[city] || 0) + 1
    }

    // Calculate averages and format
    const opportunities = Object.values(categoryStats)
      .filter(stat => stat.category !== 'other')
      .map(stat => ({
        ...stat,
        avgScore: Math.round(stat.totalScore / stat.count),
        avgRating: stat.ratingCount > 0 ? Math.round((stat.totalRating / stat.ratingCount) * 10) / 10 : null,
        topCities: Object.entries(stat.cities)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([city, count]) => ({ city, count })),
        marketGapPercent: Math.round((stat.noWebsiteCount / stat.count) * 100),
      }))
      .sort((a, b) => {
        // Sort by: avgScore * estimatedLeadValue * count (opportunity index)
        const aIndex = a.avgScore * a.estimatedLeadValue * Math.log(a.count + 1)
        const bIndex = b.avgScore * b.estimatedLeadValue * Math.log(b.count + 1)
        return bIndex - aIndex
      })

    // Get top prospects for each top category
    const topCategories = opportunities.slice(0, 5)
    const categoryProspects: Record<string, any[]> = {}

    for (const cat of topCategories) {
      const categoryProspectsList = await prisma.prospect.findMany({
        where: {
          OR: [
            { businessType: { contains: cat.category, mode: 'insensitive' } },
            { categories: { contains: cat.category, mode: 'insensitive' } },
          ],
          leadGenScore: { gte: 60 },
        },
        orderBy: { leadGenScore: 'desc' },
        take: 5,
        select: {
          id: true,
          companyName: true,
          city: true,
          leadGenScore: true,
          website: true,
          googleRating: true,
          reviewCount: true,
        },
      })
      categoryProspects[cat.category] = categoryProspectsList
    }

    return NextResponse.json({
      opportunities,
      categoryProspects,
      totalCategories: opportunities.length,
      totalProspects: prospects.length,
    })
  } catch (error) {
    console.error('Error fetching lead gen opportunities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lead gen opportunities' },
      { status: 500 }
    )
  }
}
