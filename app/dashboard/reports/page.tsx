
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { ReportsOverview } from '@/components/reports/reports-overview'
import { ExportTools } from '@/components/reports/export-tools'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Download, BarChart } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ReportsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-2 mb-2">
          <FileText className="h-8 w-8 text-purple-500" />
          <span>Export & Reports</span>
        </h1>
        <p className="text-muted-foreground mb-4">
          Generate reports and export prospect data for analysis
        </p>
        
        {/* Page Description */}
        <Card className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950 dark:to-purple-950 border-violet-200 dark:border-violet-900">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-violet-900 dark:text-violet-100 mb-1">What You Can Export</h3>
                <p className="text-sm text-violet-800 dark:text-violet-200">
                  Export any prospect data from the dashboard to CSV format for use in CRMs (HubSpot, Salesforce, GoHighLevel), email marketing platforms (Mailchimp, Constant Contact), 
                  or offline analysis in Excel/Google Sheets. All exports include business name, contact info, lead scores, review metrics, and custom tags/notes. 
                  Apply filters before exporting to create targeted lists (e.g., "hot leads in Minneapolis" or "landscapers with no website").
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-violet-900 dark:text-violet-100 mb-1">How to Leverage Exports & Reports</h3>
                <ul className="text-sm text-violet-800 dark:text-violet-200 space-y-1 list-disc list-inside">
                  <li><strong>Create Call Lists:</strong> Export phone numbers for specific segments and upload to dialer systems</li>
                  <li><strong>Email Campaigns:</strong> Export emails of hot leads, import to marketing platform, launch personalized campaigns</li>
                  <li><strong>CRM Import:</strong> Bulk import prospects into your CRM with lead scores and tags already assigned</li>
                  <li><strong>Territory Planning:</strong> Export by city/region to assign territories to sales reps or contractors</li>
                  <li><strong>Competitive Analysis:</strong> Export anomalies data to identify gaps in competitors' client bases</li>
                  <li><strong>Performance Tracking:</strong> Regularly export contacted/converted data to measure team performance and ROI</li>
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
            <CardTitle className="text-sm font-medium">Export Options</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <p>• CSV prospect exports</p>
              <p>• Filtered data exports</p>
              <p>• Contact list generation</p>
              <p>• Custom field selection</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Report Types</CardTitle>
            <BarChart className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <p>• Performance analytics</p>
              <p>• Lead scoring reports</p>
              <p>• Market trend summaries</p>
              <p>• Outreach effectiveness</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Automation</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <p>• Scheduled reports</p>
              <p>• Email delivery</p>
              <p>• Custom templates</p>
              <p>• API integrations</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Overview */}
      <ReportsOverview />

      {/* Export Tools */}
      <ExportTools />
    </div>
  )
}
