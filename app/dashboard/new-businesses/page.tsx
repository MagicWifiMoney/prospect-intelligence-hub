
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { NewBusinessesTable } from '@/components/new-businesses/new-businesses-table'
import { Target, Building2, Sparkles } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function NewBusinessesPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-2 mb-2 text-white font-display">
          <Sparkles className="h-8 w-8 text-cyan-400" />
          <span>New Businesses</span>
        </h1>
        <p className="text-gray-400 mb-4">
          Recently discovered businesses and new market entrants
        </p>

        {/* Page Description */}
        <div className="backdrop-blur-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/5 border border-cyan-500/20 rounded-2xl p-6">
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-cyan-400 mb-1">What Are New Businesses</h3>
              <p className="text-sm text-gray-300">
                Businesses detected in the last 7-30 days based on Google Business Profile creation dates, first review timestamps, and domain registration data.
                These are brand-new market entrants or recently discovered local businesses that haven't been contacted by many marketing agencies yet.
                Perfect timing to establish early relationships before competitors reach them.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-cyan-400 mb-1">Why New Businesses Are Valuable</h3>
              <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                <li><strong className="text-white">Less Competition:</strong> Other agencies haven't found them yet - be the first to make an impression</li>
                <li><strong className="text-white">High Need:</strong> Startups urgently need marketing help to get initial customers and establish online presence</li>
                <li><strong className="text-white">Budget Available:</strong> New businesses often have startup capital allocated for marketing services</li>
                <li><strong className="text-white">Long-Term Value:</strong> Win them early, keep them as they grow - potential for years of recurring revenue</li>
                <li><strong className="text-white">Receptive to Advice:</strong> New owners are learning and open to guidance, making them easier to convert</li>
                <li><strong className="text-white">Offer Welcome Packages:</strong> Position special "new business launch" pricing to create urgency</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-400">Detection Criteria</h3>
            <Building2 className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-sm space-y-1 text-gray-300">
            <p>• New Google Business listings</p>
            <p>• Recently started getting reviews</p>
            <p>• Newly registered domains</p>
            <p>• Fresh market entries</p>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-400">Opportunity Indicators</h3>
            <Target className="h-4 w-4 text-green-400" />
          </div>
          <div className="text-sm space-y-1 text-gray-300">
            <p>• Early market presence</p>
            <p>• Growing review activity</p>
            <p>• High potential for outreach</p>
            <p>• Less competition</p>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-400">Outreach Strategy</h3>
            <Sparkles className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-sm space-y-1 text-gray-300">
            <p>• Welcome new businesses</p>
            <p>• Offer startup packages</p>
            <p>• Focus on growth services</p>
            <p>• Build early relationships</p>
          </div>
        </div>
      </div>

      {/* New Businesses Table */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center space-x-2 mb-1">
            <Sparkles className="h-5 w-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white font-display">New Business Detection</h3>
          </div>
          <p className="text-sm text-gray-500">
            Recently discovered businesses and market opportunities
          </p>
        </div>
        <NewBusinessesTable />
      </div>
    </div>
  )
}
