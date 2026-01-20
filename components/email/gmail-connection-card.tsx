'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Mail, CheckCircle, Loader2, AlertCircle, ExternalLink } from 'lucide-react'

interface EmailStatus {
  configured: boolean
  provider: string
  fromEmail: string | null
  error?: string
}

export function GmailConnectionCard() {
  const [status, setStatus] = useState<EmailStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkStatus()
  }, [])

  async function checkStatus() {
    try {
      const res = await fetch('/api/email/status')
      const data = await res.json()
      setStatus(data)
    } catch (error) {
      console.error('Failed to check email status:', error)
      setStatus({ configured: false, provider: 'resend', fromEmail: null, error: 'Failed to check status' })
    } finally {
      setLoading(false)
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
              Checking Email Configuration...
            </h3>
          </div>
        </div>
      </div>
    )
  }

  if (status?.configured) {
    return (
      <div className="backdrop-blur-xl bg-gradient-to-r from-green-500/10 to-emerald-500/5 border border-green-500/20 rounded-2xl p-6">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-green-500/20 rounded-lg">
            <CheckCircle className="h-6 w-6 text-green-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-green-400 mb-2">
              Email Ready (Resend)
            </h3>
            <p className="text-sm text-gray-300 mb-4">
              Resend is configured and ready to send emails. Sending from: <code className="bg-white/10 px-1 rounded text-cyan-400">{status.fromEmail}</code>
            </p>
            <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside mb-4">
              <li>Send personalized emails from prospect pages</li>
              <li>Use mail merge templates with variables</li>
              <li>Send batch emails to ICP segments</li>
              <li>Track sent emails in the database</li>
            </ul>
            <p className="text-xs text-gray-500">
              Free tier: 100 emails/day, 3,000/month
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="backdrop-blur-xl bg-gradient-to-r from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-2xl p-6">
      <div className="flex items-start space-x-4">
        <div className="p-3 bg-amber-500/20 rounded-lg">
          <AlertCircle className="h-6 w-6 text-amber-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-amber-400 mb-2">
            Email Setup Required
          </h3>
          <p className="text-sm text-gray-300 mb-4">
            Add your Resend API key to enable email sending. Resend offers 100 free emails/day.
          </p>
          <div className="bg-[#0d1424] p-3 rounded-lg font-mono text-sm border border-white/10 mb-4">
            <p className="text-gray-400"># Add to .env (and Vercel)</p>
            <p className="text-cyan-400">RESEND_API_KEY=re_xxxxxxxxxxxx</p>
            <p className="text-gray-400 mt-2"># Optional: custom from address</p>
            <p className="text-cyan-400">RESEND_FROM_EMAIL=you@yourdomain.com</p>
          </div>
          <div className="flex space-x-3">
            <Button asChild className="bg-amber-500 hover:bg-amber-600 text-white">
              <a
                href="https://resend.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Mail className="h-4 w-4 mr-2" />
                Get Resend API Key
              </a>
            </Button>
            <Button variant="outline" asChild className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white">
              <a
                href="https://resend.com/docs"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Resend Docs
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
