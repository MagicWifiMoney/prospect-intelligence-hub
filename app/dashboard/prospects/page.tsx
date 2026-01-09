
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { ProspectsTable } from '@/components/prospects/prospects-table'
import { ProspectsFilters } from '@/components/prospects/prospects-filters'
import { LeadScoringInfo } from '@/components/ui/lead-scoring-info'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Search } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ProspectsPage() {
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
            <h1 className="text-3xl font-bold tracking-tight mb-2">All Prospects</h1>
            <p className="text-muted-foreground">
              Manage and analyze your prospect database
            </p>
          </div>
          <LeadScoringInfo />
        </div>
        
        {/* Page Description */}
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">What This Page Shows</h3>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Complete database of 3,740+ Minnesota service businesses including landscapers, home services, contractors, and more. 
                  Data sourced from Google Business Profile listings with real-time business information, review metrics, and contact details.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">How to Leverage This Data</h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                  <li><strong>Filter by Lead Score:</strong> Focus on prospects scoring 70+ for highest conversion potential</li>
                  <li><strong>Sort by Review Count:</strong> Target businesses with 10-50 reviews (growth stage, receptive to marketing)</li>
                  <li><strong>Use Quick Actions:</strong> Click the menu icon (⋮) to instantly copy contact info, generate AI outreach messages, or mark as contacted</li>
                  <li><strong>View Details:</strong> Click the eye icon (👁️) to see full business profiles, AI insights, and competitor analysis</li>
                  <li><strong>Export Filtered Lists:</strong> Use filters to create targeted lists, then export to CSV for CRM import or email campaigns</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Search & Filters</span>
          </CardTitle>
          <CardDescription>
            Filter prospects by criteria to find the right opportunities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProspectsFilters />
        </CardContent>
      </Card>

      {/* Prospects Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Prospects Database</span>
          </CardTitle>
          <CardDescription>
            View and manage all prospects in your database
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ProspectsTable />
        </CardContent>
      </Card>
    </div>
  )
}
