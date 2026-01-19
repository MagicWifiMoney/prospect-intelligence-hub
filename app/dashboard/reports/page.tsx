
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { ReportsOverview } from '@/components/reports/reports-overview'
import { ExportTools } from '@/components/reports/export-tools'
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
        <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-2 mb-2 text-white font-display">
          <FileText className="h-8 w-8 text-purple-400" />
          <span>Export & Reports</span>
        </h1>
        <p className="text-gray-400 mb-4">
          Generate reports and export prospect data for analysis
        </p>

        {/* Page Description */}
        <div className="backdrop-blur-xl bg-gradient-to-r from-purple-500/10 to-violet-500/5 border border-purple-500/20 rounded-2xl p-6">
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-purple-400 mb-1">What You Can Export</h3>
              <p className="text-sm text-gray-300">
                Export any prospect data from the dashboard to CSV format for use in CRMs (HubSpot, Salesforce, GoHighLevel), email marketing platforms (Mailchimp, Constant Contact),
                or offline analysis in Excel/Google Sheets. All exports include business name, contact info, lead scores, review metrics, and custom tags/notes.
                Apply filters before exporting to create targeted lists (e.g., &ldquo;hot leads in Minneapolis&rdquo; or &ldquo;landscapers with no website&rdquo;).
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-purple-400 mb-1">How to Leverage Exports & Reports</h3>
              <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                <li><strong className="text-white">Create Call Lists:</strong> Export phone numbers for specific segments and upload to dialer systems</li>
                <li><strong className="text-white">Email Campaigns:</strong> Export emails of hot leads, import to marketing platform, launch personalized campaigns</li>
                <li><strong className="text-white">CRM Import:</strong> Bulk import prospects into your CRM with lead scores and tags already assigned</li>
                <li><strong className="text-white">Territory Planning:</strong> Export by city/region to assign territories to sales reps or contractors</li>
                <li><strong className="text-white">Competitive Analysis:</strong> Export anomalies data to identify gaps in competitors' client bases</li>
                <li><strong className="text-white">Performance Tracking:</strong> Regularly export contacted/converted data to measure team performance &amp; ROI</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-400">Export Options</h3>
            <Download className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-sm space-y-1 text-gray-300">
            <p>• CSV prospect exports</p>
            <p>• Filtered data exports</p>
            <p>• Contact list generation</p>
            <p>• Custom field selection</p>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-400">Report Types</h3>
            <BarChart className="h-4 w-4 text-green-400" />
          </div>
          <div className="text-sm space-y-1 text-gray-300">
            <p>• Performance analytics</p>
            <p>• Lead scoring reports</p>
            <p>• Market trend summaries</p>
            <p>• Outreach effectiveness</p>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-400">Automation</h3>
            <FileText className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-sm space-y-1 text-gray-300">
            <p>• Scheduled reports</p>
            <p>• Email delivery</p>
            <p>• Custom templates</p>
            <p>• API integrations</p>
          </div>
        </div>
      </div>

      {/* Reports Overview */}
      <ReportsOverview />

      {/* Export Tools */}
      <ExportTools />
    </div>
  )
}
