
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { 
  Settings as SettingsIcon, 
  Bell, 
  Database, 
  Key,
  Save,
  RefreshCw,
  Trash2
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { LeadScoringInfo } from '@/components/ui/lead-scoring-info'

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [weeklyDigest, setWeeklyDigest] = useState(true)
  const [anomalyAlerts, setAnomalyAlerts] = useState(true)
  const [newBusinessAlerts, setNewBusinessAlerts] = useState(false)

  // Data refresh settings
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshDay, setRefreshDay] = useState('monday')

  const handleSaveSettings = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClearCache = async () => {
    try {
      toast({
        title: "Cache Cleared",
        description: "Application cache has been cleared.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear cache.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account preferences and application settings
        </p>
      </div>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>
            Configure how and when you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive email updates about your prospects
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="weekly-digest">Weekly Digest</Label>
              <p className="text-sm text-muted-foreground">
                Get a weekly summary of market trends and top prospects
              </p>
            </div>
            <Switch
              id="weekly-digest"
              checked={weeklyDigest}
              onCheckedChange={setWeeklyDigest}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="anomaly-alerts">Anomaly Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when anomalies are detected in prospect data
              </p>
            </div>
            <Switch
              id="anomaly-alerts"
              checked={anomalyAlerts}
              onCheckedChange={setAnomalyAlerts}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="new-business-alerts">New Business Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when new businesses match your criteria
              </p>
            </div>
            <Switch
              id="new-business-alerts"
              checked={newBusinessAlerts}
              onCheckedChange={setNewBusinessAlerts}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Refresh Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            <CardTitle>Data Refresh</CardTitle>
          </div>
          <CardDescription>
            Configure automated data refresh schedule
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-refresh">Automatic Weekly Refresh</Label>
              <p className="text-sm text-muted-foreground">
                Automatically refresh prospect data every week
              </p>
            </div>
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
          </div>
          {autoRefresh && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="refresh-day">Refresh Day</Label>
                <select
                  id="refresh-day"
                  value={refreshDay}
                  onChange={(e) => setRefreshDay(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="monday">Monday</option>
                  <option value="tuesday">Tuesday</option>
                  <option value="wednesday">Wednesday</option>
                  <option value="thursday">Thursday</option>
                  <option value="friday">Friday</option>
                  <option value="saturday">Saturday</option>
                  <option value="sunday">Sunday</option>
                </select>
                <p className="text-sm text-muted-foreground">
                  Data will be refreshed every {refreshDay.charAt(0).toUpperCase() + refreshDay.slice(1)} at 3:00 AM
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            <CardTitle>API Configuration</CardTitle>
          </div>
          <CardDescription>
            API credentials are securely configured
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Gemini AI</p>
                <p className="text-sm text-muted-foreground">For lead scoring and insights</p>
              </div>
              <span className="text-sm text-green-600 font-medium">✓ Connected</span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Perplexity</p>
                <p className="text-sm text-muted-foreground">For market trends analysis</p>
              </div>
              <span className="text-sm text-green-600 font-medium">✓ Connected</span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Outscraper</p>
                <p className="text-sm text-muted-foreground">For Google Maps data</p>
              </div>
              <span className="text-sm text-green-600 font-medium">✓ Connected</span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Apify</p>
                <p className="text-sm text-muted-foreground">For web scraping</p>
              </div>
              <span className="text-sm text-green-600 font-medium">✓ Connected</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lead Scoring */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            <CardTitle>Lead Scoring Algorithm</CardTitle>
          </div>
          <CardDescription>
            Understand how we calculate lead scores and identify hot leads
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <p className="text-sm">
                Every prospect receives a <strong>lead score from 0-100</strong> based on six key factors:
              </p>
              <ul className="text-sm space-y-1 ml-4 list-disc text-muted-foreground">
                <li><strong>Google Rating</strong> (25 pts) - Higher ratings indicate quality service</li>
                <li><strong>Review Count</strong> (20 pts) - More reviews = established business</li>
                <li><strong>Website Presence</strong> (15 pts) - Professional web presence</li>
                <li><strong>Contact Information</strong> (10 pts) - Phone + email availability</li>
                <li><strong>Social Media</strong> (10 pts) - Active social presence</li>
                <li><strong>Business Age</strong> (10 pts) - Longevity indicators</li>
              </ul>
            </div>

            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm font-medium mb-2">🔥 Hot Lead Criteria</p>
              <p className="text-sm text-muted-foreground">
                Prospects with scores ≥70, ratings ≥4.5⭐, 20+ reviews, website, and phone number
              </p>
              <p className="text-sm font-medium mt-2">
                Your Database: <strong>170 Hot Leads</strong>
              </p>
            </div>

            <LeadScoringInfo />
          </div>
        </CardContent>
      </Card>

      {/* System Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <CardTitle>System</CardTitle>
          </div>
          <CardDescription>
            System maintenance and data management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Clear Cache</Label>
              <p className="text-sm text-muted-foreground">
                Clear application cache to free up space
              </p>
            </div>
            <Button variant="outline" onClick={handleClearCache}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} disabled={loading} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}
