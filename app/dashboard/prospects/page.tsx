
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { ProspectsTable } from '@/components/prospects/prospects-table'
import { ProspectsFilters } from '@/components/prospects/prospects-filters'
import { LeadScoringInfo } from '@/components/ui/lead-scoring-info'
import { ExportButton } from '@/components/prospects/export-button'
import { Users, Search } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ businessType?: string; city?: string; search?: string }>
}

export default async function ProspectsPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)
  const params = await searchParams

  if (!session) {
    return null
  }

  const initialBusinessType = params.businessType || ''
  const initialCity = params.city || ''
  const initialSearch = params.search || ''

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2 text-white font-display">All Prospects</h1>
            <p className="text-gray-400">
              Manage and analyze your prospect database
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <ExportButton />
            <LeadScoringInfo />
          </div>
        </div>

        {/* Page Description */}
        <div className="backdrop-blur-xl bg-gradient-to-r from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20 rounded-2xl p-6">
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-cyan-400 mb-1">What This Page Shows</h3>
              <p className="text-sm text-gray-300">
                Complete database of 3,740+ Minnesota service businesses including landscapers, home services, contractors, and more.
                Data sourced from Google Business Profile listings with real-time business information, review metrics, and contact details.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-cyan-400 mb-1">How to Leverage This Data</h3>
              <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                <li><strong className="text-white">Filter by Lead Score:</strong> Focus on prospects scoring 70+ for highest conversion potential</li>
                <li><strong className="text-white">Sort by Review Count:</strong> Target businesses with 10-50 reviews (growth stage, receptive to marketing)</li>
                <li><strong className="text-white">Use Quick Actions:</strong> Click the menu icon to instantly copy contact info, generate AI outreach messages, or mark as contacted</li>
                <li><strong className="text-white">View Details:</strong> Click the eye icon to see full business profiles, AI insights, and competitor analysis</li>
                <li><strong className="text-white">Export Filtered Lists:</strong> Use filters to create targeted lists, then export to CSV for CRM import or email campaigns</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center space-x-2 mb-1">
            <Search className="h-5 w-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white font-display">Search & Filters</h3>
          </div>
          <p className="text-sm text-gray-500">
            Filter prospects by criteria to find the right opportunities
          </p>
        </div>
        <div className="p-6">
          <ProspectsFilters />
        </div>
      </div>

      {/* Prospects Table */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center space-x-2 mb-1">
            <Users className="h-5 w-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white font-display">Prospects Database</h3>
          </div>
          <p className="text-sm text-gray-500">
            View and manage all prospects in your database
          </p>
        </div>
        <ProspectsTable
          initialBusinessType={initialBusinessType}
          initialCity={initialCity}
          initialSearch={initialSearch}
        />
      </div>
    </div>
  )
}
