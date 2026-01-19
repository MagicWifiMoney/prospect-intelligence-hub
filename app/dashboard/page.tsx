
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { OverviewStats } from '@/components/dashboard/overview-stats'
import { ProspectCharts } from '@/components/dashboard/prospect-charts'
import { HotLeadsPreview } from '@/components/dashboard/hot-leads-preview'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { MarketTrendsPreview } from '@/components/dashboard/market-trends-preview'
import { QuickStartGuide } from '@/components/dashboard/quick-start-guide'
import { Sparkles, Info } from 'lucide-react'

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
      <div className="backdrop-blur-xl bg-gradient-to-r from-cyan-500/10 via-cyan-500/5 to-amber-500/10 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          <span className="text-sm text-cyan-400 font-medium">AI-Powered Intelligence</span>
        </div>
        <h1 className="text-2xl font-bold text-white font-display mb-2">
          Welcome back, {session?.user?.name?.split(' ')[0] || 'User'}!
        </h1>
        <p className="text-gray-400 mb-4">
          Here&apos;s your prospect intelligence overview for today
        </p>
        <div className="backdrop-blur-sm bg-white/5 rounded-xl p-4 border border-white/10">
          <h3 className="font-semibold text-white mb-2 flex items-center text-sm">
            <Info className="w-4 h-4 mr-2 text-cyan-400" />
            About This Dashboard
          </h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            This overview aggregates data from <span className="text-cyan-400 font-medium">{dashboardData.totalProspects.toLocaleString()}</span> Minnesota service business prospects across landscaping, home services, construction, and more.
            Data is sourced from Google Business Profile listings and analyzed with AI-powered lead scoring.
            Use this dashboard to identify high-potential prospects, track emerging trends, and prioritize your outreach efforts.
          </p>
        </div>
      </div>

      {/* Quick Start Guide */}
      <QuickStartGuide />

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
