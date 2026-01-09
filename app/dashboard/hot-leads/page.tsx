
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { HotLeadsTable } from '@/components/hot-leads/hot-leads-table'
import { LeadScoringInfo } from '@/components/ui/lead-scoring-info'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Star, Target } from 'lucide-react'

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
            <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-2 mb-2">
              <Star className="h-8 w-8 text-orange-500" />
              <span>Hot Leads</span>
            </h1>
            <p className="text-muted-foreground">
              High-quality prospects ready for immediate outreach
            </p>
          </div>
          <LeadScoringInfo />
        </div>
        
        {/* Page Description */}
        <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 border-orange-200 dark:border-orange-900">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">What Makes a Hot Lead</h3>
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  These prospects are automatically identified by our AI scoring system based on multiple quality signals: lead score ≥70%, strong review profiles (4.5+ rating, 20+ reviews), 
                  verified contact information, and business health indicators. These businesses show active engagement with customers and are most likely to respond positively to marketing services.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">How to Leverage Hot Leads</h3>
                <ul className="text-sm text-orange-800 dark:text-orange-200 space-y-1 list-disc list-inside">
                  <li><strong>Prioritize First:</strong> Contact these prospects before others - they have the highest conversion potential</li>
                  <li><strong>Use AI Insights:</strong> Click "Generate AI Message" for personalized outreach based on their business profile and reviews</li>
                  <li><strong>Act Fast:</strong> Best results come from reaching out within 24-48 hours of identification</li>
                  <li><strong>Track Results:</strong> Use "Mark as Contacted" to track your outreach and measure hot lead conversion rates</li>
                  <li><strong>Focus on Value:</strong> These businesses are already successful - emphasize how you can help them scale, not fix problems</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qualification Criteria</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <p>• Lead Score ≥ 75%</p>
              <p>• Google Rating ≥ 4.5</p>
              <p>• Review Count ≥ 20</p>
              <p>• AI-flagged as hot lead</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outreach Priority</CardTitle>
            <Star className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <p>• Contact within 24-48 hours</p>
              <p>• Personalize messaging</p>
              <p>• Follow AI recommendations</p>
              <p>• Track response rates</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Indicators</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <p>• High review activity</p>
              <p>• Strong online presence</p>
              <p>• Growth signals detected</p>
              <p>• ICP score match</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hot Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Star className="h-5 w-5 text-orange-500" />
            <span>Hot Leads Database</span>
          </CardTitle>
          <CardDescription>
            Prospects with the highest potential for conversion
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <HotLeadsTable />
        </CardContent>
      </Card>
    </div>
  )
}
