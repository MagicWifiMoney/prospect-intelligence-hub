import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { Mail, Send, Inbox, FileText } from 'lucide-react'
import { GmailConnectionCard } from '@/components/email/gmail-connection-card'

export const dynamic = 'force-dynamic'

export default async function EmailHubPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-2 mb-2 text-white font-display">
          <Mail className="h-8 w-8 text-cyan-400" />
          <span>Email Hub</span>
        </h1>
        <p className="text-gray-400">
          Send personalized outreach emails and track conversations with prospects
        </p>
      </div>

      {/* Gmail Connection Card */}
      <GmailConnectionCard />

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 opacity-60">
          <div className="flex items-center space-x-2 mb-3">
            <Send className="h-5 w-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Compose</h3>
          </div>
          <p className="text-sm text-gray-500 mb-3">
            Send personalized outreach emails
          </p>
          <div className="text-sm space-y-2 text-gray-400">
            <p>• Mail merge with prospect data</p>
            <p>• Save and reuse templates</p>
            <p>• Schedule sends</p>
            <p>• Track opens and clicks</p>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 opacity-60">
          <div className="flex items-center space-x-2 mb-3">
            <Inbox className="h-5 w-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">Inbox</h3>
          </div>
          <p className="text-sm text-gray-500 mb-3">
            View replies and conversations
          </p>
          <div className="text-sm space-y-2 text-gray-400">
            <p>• See all prospect replies</p>
            <p>• Thread view per prospect</p>
            <p>• Quick reply from hub</p>
            <p>• Link to prospect profile</p>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 opacity-60">
          <div className="flex items-center space-x-2 mb-3">
            <FileText className="h-5 w-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Templates</h3>
          </div>
          <p className="text-sm text-gray-500 mb-3">
            Manage email templates
          </p>
          <div className="text-sm space-y-2 text-gray-400">
            <p>• Initial outreach templates</p>
            <p>• Follow-up sequences</p>
            <p>• Value offer templates</p>
            <p>• A/B test variations</p>
          </div>
        </div>
      </div>

      {/* Template Preview */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white font-display">Sample Email Template</h3>
          <p className="text-sm text-gray-500">
            Here&apos;s what a personalized outreach email looks like with mail merge
          </p>
        </div>
        <div className="p-6">
          <div className="bg-[#0d1424] p-4 rounded-lg font-mono text-sm border border-white/10">
            <p className="text-gray-400 mb-2">Subject: Quick question about {"{{companyName}}"}&apos;s online presence</p>
            <div className="border-t border-white/10 pt-2 mt-2 text-gray-300">
              <p>Hi {"{{ownerName}}"},</p>
              <br />
              <p>I noticed {"{{companyName}}"} has excellent reviews ({"{{googleRating}}"} stars from {"{{reviewCount}}"} customers!) but I couldn&apos;t find your website when searching for &quot;{"{{businessType}}"} in {"{{city}}}"}&quot;.</p>
              <br />
              <p>Your competitors are showing up instead - and they don&apos;t have nearly as good reviews as you do.</p>
              <br />
              <p>Would you be open to a quick 10-minute call to discuss how we could help {"{{companyName}}"} show up first when people search for your services?</p>
              <br />
              <p>Best,<br />[Your Name]</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs">{"{{companyName}}"}</span>
            <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs">{"{{ownerName}}"}</span>
            <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs">{"{{googleRating}}"}</span>
            <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs">{"{{reviewCount}}"}</span>
            <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs">{"{{businessType}}"}</span>
            <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs">{"{{city}}"}</span>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white font-display">Setup Instructions</h3>
          <p className="text-sm text-gray-500">
            How to enable Gmail integration
          </p>
        </div>
        <div className="p-6">
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
            <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Google Cloud Console</a></li>
            <li>Create a new project or select existing one</li>
            <li>Enable the Gmail API</li>
            <li>Create OAuth 2.0 credentials (Web application type)</li>
            <li>Add redirect URIs:<br />
              <code className="bg-white/10 px-1 rounded text-cyan-400">http://localhost:3000/api/auth/gmail/callback</code><br />
              <code className="bg-white/10 px-1 rounded text-cyan-400">https://prospect-intelligence-hub.vercel.app/api/auth/gmail/callback</code>
            </li>
            <li>Copy Client ID and Client Secret to your .env file (and Vercel env vars)</li>
            <li>Restart the app and click &quot;Connect Gmail&quot;</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
