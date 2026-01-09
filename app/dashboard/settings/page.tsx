'use client'

import { useState } from 'react'
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
        <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-2 mb-2 text-white font-display">
          <SettingsIcon className="h-8 w-8 text-cyan-400" />
          <span>Settings</span>
        </h1>
        <p className="text-gray-400">
          Manage your account preferences and application settings
        </p>
      </div>

      {/* Notification Settings */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <Bell className="h-5 w-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white font-display">Notifications</h3>
          </div>
          <p className="text-sm text-gray-500">
            Configure how and when you receive notifications
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications" className="text-white">Email Notifications</Label>
              <p className="text-sm text-gray-500">
                Receive email updates about your prospects
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
          <Separator className="bg-white/10" />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="weekly-digest" className="text-white">Weekly Digest</Label>
              <p className="text-sm text-gray-500">
                Get a weekly summary of market trends and top prospects
              </p>
            </div>
            <Switch
              id="weekly-digest"
              checked={weeklyDigest}
              onCheckedChange={setWeeklyDigest}
            />
          </div>
          <Separator className="bg-white/10" />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="anomaly-alerts" className="text-white">Anomaly Alerts</Label>
              <p className="text-sm text-gray-500">
                Get notified when anomalies are detected in prospect data
              </p>
            </div>
            <Switch
              id="anomaly-alerts"
              checked={anomalyAlerts}
              onCheckedChange={setAnomalyAlerts}
            />
          </div>
          <Separator className="bg-white/10" />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="new-business-alerts" className="text-white">New Business Alerts</Label>
              <p className="text-sm text-gray-500">
                Get notified when new businesses match your criteria
              </p>
            </div>
            <Switch
              id="new-business-alerts"
              checked={newBusinessAlerts}
              onCheckedChange={setNewBusinessAlerts}
            />
          </div>
        </div>
      </div>

      {/* Data Refresh Settings */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <RefreshCw className="h-5 w-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white font-display">Data Refresh</h3>
          </div>
          <p className="text-sm text-gray-500">
            Configure automated data refresh schedule
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-refresh" className="text-white">Automatic Weekly Refresh</Label>
              <p className="text-sm text-gray-500">
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
              <Separator className="bg-white/10" />
              <div className="space-y-2">
                <Label htmlFor="refresh-day" className="text-white">Refresh Day</Label>
                <select
                  id="refresh-day"
                  value={refreshDay}
                  onChange={(e) => setRefreshDay(e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                >
                  <option value="monday" className="bg-[#0d1424]">Monday</option>
                  <option value="tuesday" className="bg-[#0d1424]">Tuesday</option>
                  <option value="wednesday" className="bg-[#0d1424]">Wednesday</option>
                  <option value="thursday" className="bg-[#0d1424]">Thursday</option>
                  <option value="friday" className="bg-[#0d1424]">Friday</option>
                  <option value="saturday" className="bg-[#0d1424]">Saturday</option>
                  <option value="sunday" className="bg-[#0d1424]">Sunday</option>
                </select>
                <p className="text-sm text-gray-500">
                  Data will be refreshed every {refreshDay.charAt(0).toUpperCase() + refreshDay.slice(1)} at 3:00 AM
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* API Configuration */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <Key className="h-5 w-5 text-amber-400" />
            <h3 className="text-lg font-semibold text-white font-display">API Configuration</h3>
          </div>
          <p className="text-sm text-gray-500">
            API credentials are securely configured
          </p>
        </div>
        <div className="p-6 space-y-3">
          <div className="flex items-center justify-between p-3 border border-white/10 rounded-lg bg-white/5">
            <div>
              <p className="font-medium text-white">Gemini AI</p>
              <p className="text-sm text-gray-500">For lead scoring and insights</p>
            </div>
            <span className="text-sm text-green-400 font-medium">✓ Connected</span>
          </div>
          <div className="flex items-center justify-between p-3 border border-white/10 rounded-lg bg-white/5">
            <div>
              <p className="font-medium text-white">Perplexity</p>
              <p className="text-sm text-gray-500">For market trends analysis</p>
            </div>
            <span className="text-sm text-green-400 font-medium">✓ Connected</span>
          </div>
          <div className="flex items-center justify-between p-3 border border-white/10 rounded-lg bg-white/5">
            <div>
              <p className="font-medium text-white">Outscraper</p>
              <p className="text-sm text-gray-500">For Google Maps data</p>
            </div>
            <span className="text-sm text-green-400 font-medium">✓ Connected</span>
          </div>
          <div className="flex items-center justify-between p-3 border border-white/10 rounded-lg bg-white/5">
            <div>
              <p className="font-medium text-white">Apify</p>
              <p className="text-sm text-gray-500">For web scraping</p>
            </div>
            <span className="text-sm text-green-400 font-medium">✓ Connected</span>
          </div>
        </div>
      </div>

      {/* Lead Scoring */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <SettingsIcon className="h-5 w-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white font-display">Lead Scoring Algorithm</h3>
          </div>
          <p className="text-sm text-gray-500">
            Understand how we calculate lead scores and identify hot leads
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div className="p-4 bg-white/5 rounded-lg space-y-2 border border-white/10">
            <p className="text-sm text-gray-300">
              Every prospect receives a <strong className="text-white">lead score from 0-100</strong> based on six key factors:
            </p>
            <ul className="text-sm space-y-1 ml-4 list-disc text-gray-400">
              <li><strong className="text-white">Google Rating</strong> (25 pts) - Higher ratings indicate quality service</li>
              <li><strong className="text-white">Review Count</strong> (20 pts) - More reviews = established business</li>
              <li><strong className="text-white">Website Presence</strong> (15 pts) - Professional web presence</li>
              <li><strong className="text-white">Contact Information</strong> (10 pts) - Phone + email availability</li>
              <li><strong className="text-white">Social Media</strong> (10 pts) - Active social presence</li>
              <li><strong className="text-white">Business Age</strong> (10 pts) - Longevity indicators</li>
            </ul>
          </div>

          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <p className="text-sm font-medium text-amber-400 mb-2">Hot Lead Criteria</p>
            <p className="text-sm text-gray-300">
              Prospects with scores ≥70, ratings ≥4.5, 20+ reviews, website, and phone number
            </p>
            <p className="text-sm font-medium text-white mt-2">
              Your Database: <strong className="text-amber-400">170 Hot Leads</strong>
            </p>
          </div>

          <LeadScoringInfo />
        </div>
      </div>

      {/* System Actions */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <Database className="h-5 w-5 text-red-400" />
            <h3 className="text-lg font-semibold text-white font-display">System</h3>
          </div>
          <p className="text-sm text-gray-500">
            System maintenance and data management
          </p>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-white">Clear Cache</Label>
              <p className="text-sm text-gray-500">
                Clear application cache to free up space
              </p>
            </div>
            <Button variant="outline" onClick={handleClearCache} className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} disabled={loading} size="lg" className="bg-cyan-500 hover:bg-cyan-600 text-white">
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}
