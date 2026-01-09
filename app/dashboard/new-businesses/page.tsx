
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { NewBusinessesTable } from '@/components/new-businesses/new-businesses-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Target, Building2 } from 'lucide-react'

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
        <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-2 mb-2">
          <Target className="h-8 w-8 text-blue-500" />
          <span>New Businesses</span>
        </h1>
        <p className="text-muted-foreground mb-4">
          Recently discovered businesses and new market entrants
        </p>
        
        {/* Page Description */}
        <Card className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950 dark:to-blue-950 border-cyan-200 dark:border-cyan-900">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-cyan-900 dark:text-cyan-100 mb-1">What Are New Businesses</h3>
                <p className="text-sm text-cyan-800 dark:text-cyan-200">
                  Businesses detected in the last 7-30 days based on Google Business Profile creation dates, first review timestamps, and domain registration data. 
                  These are brand-new market entrants or recently discovered local businesses that haven't been contacted by many marketing agencies yet. 
                  Perfect timing to establish early relationships before competitors reach them.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-cyan-900 dark:text-cyan-100 mb-1">Why New Businesses Are Valuable</h3>
                <ul className="text-sm text-cyan-800 dark:text-cyan-200 space-y-1 list-disc list-inside">
                  <li><strong>Less Competition:</strong> Other agencies haven't found them yet - be the first to make an impression</li>
                  <li><strong>High Need:</strong> Startups urgently need marketing help to get initial customers and establish online presence</li>
                  <li><strong>Budget Available:</strong> New businesses often have startup capital allocated for marketing services</li>
                  <li><strong>Long-Term Value:</strong> Win them early, keep them as they grow - potential for years of recurring revenue</li>
                  <li><strong>Receptive to Advice:</strong> New owners are learning and open to guidance, making them easier to convert</li>
                  <li><strong>Offer Welcome Packages:</strong> Position special "new business launch" pricing to create urgency</li>
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
            <CardTitle className="text-sm font-medium">Detection Criteria</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <p>• New Google Business listings</p>
              <p>• Recently started getting reviews</p>
              <p>• Newly registered domains</p>
              <p>• Fresh market entries</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opportunity Indicators</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <p>• Early market presence</p>
              <p>• Growing review activity</p>
              <p>• High potential for outreach</p>
              <p>• Less competition</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outreach Strategy</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <p>• Welcome new businesses</p>
              <p>• Offer startup packages</p>
              <p>• Focus on growth services</p>
              <p>• Build early relationships</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Businesses Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-blue-500" />
            <span>New Business Detection</span>
          </CardTitle>
          <CardDescription>
            Recently discovered businesses and market opportunities
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <NewBusinessesTable />
        </CardContent>
      </Card>
    </div>
  )
}
