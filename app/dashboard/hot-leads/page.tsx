
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { HotLeadsTable } from '@/components/hot-leads/hot-leads-table'
import { LeadScoringInfo } from '@/components/ui/lead-scoring-info'
import { Star, Target, TrendingUp } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function HotLeadsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-2 mb-2 text-white font-display">
              <Star className="h-8 w-8 text-amber-400" />
              <span>Hot Leads</span>
            </h1>
            <p className="text-gray-400">
              High-quality prospects ready for immediate outreach
            </p>
          </div>
          <LeadScoringInfo />
        </div>

        {/* Page Description */}
        <div className="backdrop-blur-xl bg-gradient-to-r from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-2xl p-6">
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-amber-400 mb-1">What Makes a Hot Lead</h3>
              <p className="text-sm text-gray-300">
                These prospects are automatically identified by our AI scoring system based on multiple quality signals: lead score ≥70%, strong review profiles (4.5+ rating, 20+ reviews),
                verified contact information, and business health indicators. These businesses show active engagement with customers and are most likely to respond positively to marketing services.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-amber-400 mb-1">How to Leverage Hot Leads</h3>
              <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                <li><strong className="text-white">Prioritize First:</strong> Contact these prospects before others - they have the highest conversion potential</li>
                <li><strong className="text-white">Use AI Insights:</strong> Click "Generate AI Message" for personalized outreach based on their business profile and reviews</li>
                <li><strong className="text-white">Act Fast:</strong> Best results come from reaching out within 24-48 hours of identification</li>
                <li><strong className="text-white">Track Results:</strong> Use "Mark as Contacted" to track your outreach and measure hot lead conversion rates</li>
                <li><strong className="text-white">Focus on Value:</strong> These businesses are already successful - emphasize how you can help them scale, not fix problems</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-400">Qualification Criteria</h3>
            <Target className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-sm space-y-1 text-gray-300">
            <p>• Lead Score ≥ 75%</p>
            <p>• Google Rating ≥ 4.5</p>
            <p>• Review Count ≥ 20</p>
            <p>• AI-flagged as hot lead</p>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-400">Outreach Priority</h3>
            <Star className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-sm space-y-1 text-gray-300">
            <p>• Contact within 24-48 hours</p>
            <p>• Personalize messaging</p>
            <p>• Follow AI recommendations</p>
            <p>• Track response rates</p>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-400">Success Indicators</h3>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </div>
          <div className="text-sm space-y-1 text-gray-300">
            <p>• High review activity</p>
            <p>• Strong online presence</p>
            <p>• Growth signals detected</p>
            <p>• ICP score match</p>
          </div>
        </div>
      </div>

      {/* Hot Leads Table */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center space-x-2 mb-1">
            <Star className="h-5 w-5 text-amber-400" />
            <h3 className="text-lg font-semibold text-white font-display">Hot Leads Database</h3>
          </div>
          <p className="text-sm text-gray-500">
            Prospects with the highest potential for conversion
          </p>
        </div>
        <HotLeadsTable />
      </div>
    </div>
  )
}
