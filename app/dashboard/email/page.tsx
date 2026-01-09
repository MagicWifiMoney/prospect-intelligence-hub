import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, Send, Inbox, FileText, Settings, ExternalLink } from 'lucide-react'
import Link from 'next/link'

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
        <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-2 mb-2">
          <Mail className="h-8 w-8 text-blue-500" />
          <span>Email Hub</span>
        </h1>
        <p className="text-muted-foreground">
          Send personalized outreach emails and track conversations with prospects
        </p>
      </div>

      {/* Setup Required Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-900">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Gmail Integration Setup Required
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
                To send emails directly from the hub, you need to connect your Google Workspace account.
                This will allow you to:
              </p>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside mb-4">
                <li>Send personalized emails from prospect pages</li>
                <li>Use mail merge templates with variables</li>
                <li>Track sent emails and view replies</li>
                <li>See conversation threads per prospect</li>
              </ul>
              <div className="flex space-x-3">
                <Button disabled className="bg-blue-600 hover:bg-blue-700">
                  <Mail className="h-4 w-4 mr-2" />
                  Connect Gmail (Coming Soon)
                </Button>
                <Button variant="outline" asChild>
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Setup OAuth Credentials
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="opacity-60">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Send className="h-5 w-5 text-green-500" />
              <CardTitle className="text-lg">Compose</CardTitle>
            </div>
            <CardDescription>
              Send personalized outreach emails
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-2 text-muted-foreground">
              <p>• Mail merge with prospect data</p>
              <p>• Save and reuse templates</p>
              <p>• Schedule sends</p>
              <p>• Track opens and clicks</p>
            </div>
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Inbox className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-lg">Inbox</CardTitle>
            </div>
            <CardDescription>
              View replies and conversations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-2 text-muted-foreground">
              <p>• See all prospect replies</p>
              <p>• Thread view per prospect</p>
              <p>• Quick reply from hub</p>
              <p>• Link to prospect profile</p>
            </div>
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-purple-500" />
              <CardTitle className="text-lg">Templates</CardTitle>
            </div>
            <CardDescription>
              Manage email templates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-2 text-muted-foreground">
              <p>• Initial outreach templates</p>
              <p>• Follow-up sequences</p>
              <p>• Value offer templates</p>
              <p>• A/B test variations</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Template Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Sample Email Template</CardTitle>
          <CardDescription>
            Here&apos;s what a personalized outreach email looks like with mail merge
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg font-mono text-sm">
            <p className="text-muted-foreground mb-2">Subject: Quick question about {"{{companyName}}"}&apos;s online presence</p>
            <div className="border-t pt-2 mt-2">
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
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">{"{{companyName}}"}</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">{"{{ownerName}}"}</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">{"{{googleRating}}"}</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">{"{{reviewCount}}"}</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">{"{{businessType}}"}</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">{"{{city}}"}</span>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
          <CardDescription>
            How to enable Gmail integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a></li>
            <li>Create a new project or select existing one</li>
            <li>Enable the Gmail API</li>
            <li>Create OAuth 2.0 credentials (Web application type)</li>
            <li>Add <code className="bg-muted px-1 rounded">http://localhost:3000/api/auth/google</code> as authorized redirect URI</li>
            <li>Copy Client ID and Client Secret to your .env file</li>
            <li>Restart the app and click &quot;Connect Gmail&quot;</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
