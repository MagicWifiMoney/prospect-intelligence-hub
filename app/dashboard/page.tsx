
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { OverviewStats } from '@/components/dashboard/overview-stats'
import { ProspectCharts } from '@/components/dashboard/prospect-charts'
import { HotLeadsPreview } from '@/components/dashboard/hot-leads-preview'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { MarketTrendsPreview } from '@/components/dashboard/market-trends-preview'

export const dynamic = 'force-dynamic'

async function getDashboardData() {
  try {
    const [
      totalProspects,
      hotLeads,
      newBusinesses,
      recentProspects,
      marketTrends
    ] = await Promise.all([
      prisma.prospect.count(),
      prisma.prospect.count({ where: { isHotLead: true } }),
      prisma.newBusiness.count({ where: { detectedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
      prisma.prospect.findMany({
        take: 5,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          companyName: true,
          businessType: true,
          city: true,
          leadScore: true,
          isHotLead: true,
          updatedAt: true,
        },
      }),
      prisma.marketTrend.findMany({
        take: 3,
        orderBy: { extractedAt: 'desc' },
        select: {
          id: true,
          category: true,
          title: true,
          content: true,
          trend: true,
          relevance: true,
          extractedAt: true,
        },
      }),
    ])

    const averageScore = await prisma.prospect.aggregate({
      _avg: { leadScore: true },
      where: { leadScore: { not: null } },
    })

    const scoreDistribution = await prisma.prospect.groupBy({
      by: ['leadScore'],
      _count: true,
      where: { leadScore: { not: null } },
    })

    return {
      totalProspects,
      hotLeads,
      newBusinesses,
      averageScore: averageScore._avg.leadScore || 0,
      recentProspects,
      marketTrends,
      scoreDistribution,
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return {
      totalProspects: 0,
      hotLeads: 0,
      newBusinesses: 0,
      averageScore: 0,
      recentProspects: [],
      marketTrends: [],
      scoreDistribution: [],
    }
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const dashboardData = await getDashboardData()

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {session?.user?.name?.split(' ')[0] || 'User'}! 👋
        </h1>
        <p className="text-blue-100 mb-4">
          Here's your prospect intelligence overview for today
        </p>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4 border border-white/20">
          <h3 className="font-semibold mb-2 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            About This Dashboard
          </h3>
          <p className="text-sm text-blue-50 leading-relaxed">
            This overview aggregates data from {dashboardData.totalProspects.toLocaleString()} Minnesota service business prospects across landscaping, home services, construction, and more. 
            Data is sourced from Google Business Profile listings and analyzed with AI-powered lead scoring. 
            Use this dashboard to identify high-potential prospects, track emerging trends, and prioritize your outreach efforts based on business health indicators like review counts, ratings, and engagement signals.
          </p>
        </div>
      </div>

      {/* Overview Stats */}
      <OverviewStats
        totalProspects={dashboardData.totalProspects}
        hotLeads={dashboardData.hotLeads}
        newBusinesses={dashboardData.newBusinesses}
        averageScore={dashboardData.averageScore}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Charts */}
        <div className="lg:col-span-2">
          <ProspectCharts scoreDistribution={dashboardData.scoreDistribution} />
        </div>

        {/* Hot Leads Preview */}
        <HotLeadsPreview />

        {/* Recent Activity */}
        <RecentActivity recentProspects={dashboardData.recentProspects} />
      </div>

      {/* Market Trends */}
      <MarketTrendsPreview trends={dashboardData.marketTrends} />
    </div>
  )
}
