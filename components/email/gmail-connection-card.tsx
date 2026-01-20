'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Mail, Settings, ExternalLink, CheckCircle, Loader2, XCircle } from 'lucide-react'

interface GmailStatus {
  connected: boolean
  error?: string
}

export function GmailConnectionCard() {
  const [status, setStatus] = useState<GmailStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState(false)

  useEffect(() => {
    checkStatus()
  }, [])

  async function checkStatus() {
    try {
      const res = await fetch('/api/auth/gmail?action=status')
      const data = await res.json()
      setStatus(data)
    } catch (error) {
      console.error('Failed to check Gmail status:', error)
      setStatus({ connected: false, error: 'Failed to check status' })
    } finally {
      setLoading(false)
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true)
    try {
      const res = await fetch('/api/auth/gmail?action=disconnect')
      const data = await res.json()
      if (data.success) {
        setStatus({ connected: false })
      }
    } catch (error) {
      console.error('Failed to disconnect Gmail:', error)
    } finally {
      setDisconnecting(false)
    }
  }

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/5 border border-cyan-500/20 rounded-2xl p-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-cyan-500/20 rounded-lg">
            <Loader2 className="h-6 w-6 text-cyan-400 animate-spin" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-cyan-400 mb-2">
              Checking Gmail Connection...
            </h3>
          </div>
        </div>
      </div>
    )
  }

  if (status?.connected) {
    return (
      <div className="backdrop-blur-xl bg-gradient-to-r from-green-500/10 to-emerald-500/5 border border-green-500/20 rounded-2xl p-6">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-green-500/20 rounded-lg">
            <CheckCircle className="h-6 w-6 text-green-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-green-400 mb-2">
              Gmail Connected
            </h3>
            <p className="text-sm text-gray-300 mb-4">
              Your Gmail account is connected. You can now:
            </p>
            <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside mb-4">
              <li>Send personalized emails from prospect pages</li>
              <li>Use mail merge templates with variables</li>
              <li>Send batch emails to ICP segments</li>
              <li>Track sent emails in the database</li>
            </ul>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="bg-white/5 border-white/10 text-gray-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
              >
                {disconnecting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Disconnect Gmail
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="backdrop-blur-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/5 border border-cyan-500/20 rounded-2xl p-6">
      <div className="flex items-start space-x-4">
        <div className="p-3 bg-cyan-500/20 rounded-lg">
          <Settings className="h-6 w-6 text-cyan-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-cyan-400 mb-2">
            Connect Your Gmail Account
          </h3>
          <p className="text-sm text-gray-300 mb-4">
            Connect your Google Workspace account to send emails directly from the hub.
            This will allow you to:
          </p>
          <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside mb-4">
            <li>Send personalized emails from prospect pages</li>
            <li>Use mail merge templates with variables</li>
            <li>Track sent emails and view replies</li>
            <li>See conversation threads per prospect</li>
          </ul>
          <div className="flex space-x-3">
            <Button asChild className="bg-cyan-500 hover:bg-cyan-600 text-white">
              <a href="/api/auth/gmail?action=connect">
                <Mail className="h-4 w-4 mr-2" />
                Connect Gmail
              </a>
            </Button>
            <Button variant="outline" asChild className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white">
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
    </div>
  )
}
