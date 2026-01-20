'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import {
  Mail,
  Loader2,
  RefreshCw,
  Send,
  AlertCircle,
  CheckCircle2,
  Link as LinkIcon
} from 'lucide-react'
import Link from 'next/link'

interface OutreachEmailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prospectId: string
  companyName: string
  ownerEmail?: string | null
  email?: string | null
  onEmailSent?: () => void
}

export function OutreachEmailModal({
  open,
  onOpenChange,
  prospectId,
  companyName,
  ownerEmail,
  email,
  onEmailSent
}: OutreachEmailModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [gmailNotConnected, setGmailNotConnected] = useState(false)
  const [usedFallback, setUsedFallback] = useState(false)

  // Generate email when modal opens
  useEffect(() => {
    if (open && !subject && !body) {
      generateEmail()
    }
  }, [open])

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setSubject('')
      setBody('')
      setRecipientEmail('')
      setError(null)
      setGmailNotConnected(false)
      setUsedFallback(false)
    }
  }, [open])

  const generateEmail = async () => {
    setLoading(true)
    setError(null)
    setUsedFallback(false)

    try {
      const response = await fetch(`/api/prospects/${prospectId}/generate-email`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        setSubject(data.subject)
        setBody(data.body)
        setRecipientEmail(data.recipientEmail)
        setUsedFallback(data.usedFallback || false)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to generate email')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const sendEmail = async () => {
    if (!subject.trim() || !body.trim()) {
      toast({
        title: "Error",
        description: "Subject and body are required",
        variant: "destructive"
      })
      return
    }

    setSending(true)
    setError(null)
    setGmailNotConnected(false)

    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospectId,
          subject,
          body
        })
      })

      if (response.ok) {
        toast({
          title: "Email Sent",
          description: `Outreach email sent to ${recipientEmail}`,
        })
        onOpenChange(false)
        onEmailSent?.()
      } else {
        const errorData = await response.json()

        // Check if Gmail is not connected
        if (errorData.error?.toLowerCase().includes('gmail not connected')) {
          setGmailNotConnected(true)
          setError(null)
        } else {
          setError(errorData.error || 'Failed to send email')
        }
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const recipientDisplay = ownerEmail || email || 'No email available'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-green-600" />
            <span>Outreach Email to {companyName}</span>
          </DialogTitle>
          <DialogDescription>
            Preview and customize the AI-generated email before sending
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">Generating personalized email...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Recipient Display */}
            <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium text-muted-foreground">To:</span>
              <span className="text-sm">{recipientDisplay}</span>
            </div>

            {/* Fallback Notice */}
            {usedFallback && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Using a template email. Click "Regenerate" to try AI generation again.
                </AlertDescription>
              </Alert>
            )}

            {/* Gmail Not Connected Warning */}
            {gmailNotConnected && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>Gmail not connected. Please connect your Gmail account to send emails.</span>
                  <Link href="/dashboard/settings">
                    <Button variant="outline" size="sm" className="ml-4">
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Connect Gmail
                    </Button>
                  </Link>
                </AlertDescription>
              </Alert>
            )}

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Subject Input */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject line"
                disabled={sending}
              />
            </div>

            {/* Body Textarea */}
            <div className="space-y-2">
              <Label htmlFor="body">Body</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Email body content"
                rows={10}
                disabled={sending}
                className="font-normal resize-none"
              />
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={generateEmail}
            disabled={loading || sending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Regenerate
          </Button>
          <div className="flex-1" />
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={sending}
          >
            Cancel
          </Button>
          <Button
            onClick={sendEmail}
            disabled={loading || sending || !subject.trim() || !body.trim()}
            className="bg-green-600 hover:bg-green-700"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
