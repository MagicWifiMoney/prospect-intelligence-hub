
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { AnalyticsOverview } from '@/components/analytics/analytics-overview'
import { PerformanceCharts } from '@/components/analytics/performance-charts'
import { ConversionMetrics } from '@/components/analytics/conversion-metrics'
import { BarChart } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-2 mb-2 text-white font-display">
          <BarChart className="h-8 w-8 text-green-400" />
          <span>Analytics Dashboard</span>
        </h1>
        <p className="text-gray-400 mb-4">
          Comprehensive insights into prospect performance and trends
        </p>

        {/* Page Description */}
        <div className="backdrop-blur-xl bg-gradient-to-r from-green-500/10 to-emerald-500/5 border border-green-500/20 rounded-2xl p-6">
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-green-400 mb-1">What This Analytics Shows</h3>
              <p className="text-sm text-gray-300">
                Data-driven insights across your entire prospect database: lead score distribution patterns, review health metrics, business type performance,
                geographic concentration analysis, and conversion funnel tracking. All metrics are calculated from your 3,740+ prospects and updated in real-time.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-green-400 mb-1">How to Use Analytics for Better Results</h3>
              <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                <li><strong className="text-white">Lead Score Distribution:</strong> Identify which score ranges have the most prospects - focus your efforts where there's volume</li>
                <li><strong className="text-white">Review Trends:</strong> Track average ratings over time to spot quality degradation or improvement in your prospect pool</li>
                <li><strong className="text-white">Conversion Funnel:</strong> See drop-off points from contacted → converted to optimize your sales process</li>
                <li><strong className="text-white">Business Type Analysis:</strong> Discover which industries have highest conversion rates to refine your ideal customer profile</li>
                <li><strong className="text-white">Geographic Patterns:</strong> Identify high-performing cities/regions to concentrate marketing spend and outreach</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Overview */}
      <AnalyticsOverview />

      {/* Performance Charts */}
      <PerformanceCharts />

      {/* Conversion Metrics */}
      <ConversionMetrics />
    </div>
  )
}
