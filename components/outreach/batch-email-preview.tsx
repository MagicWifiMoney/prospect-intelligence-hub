'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Loader2,
  Mail,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Users,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface EmailPreview {
  prospectId: string
  companyName: string
  recipientEmail: string | null
  subject: string
  body: string
  usedFallback: boolean
}

interface SendResult {
  prospectId: string
  companyName: string
  recipientEmail: string
  success: boolean
  messageId?: string
  error?: string
}

interface BatchEmailPreviewProps {
  segmentId: string
  segmentName: string
  onClose: () => void
  onSent: () => void
}

export function BatchEmailPreview({
  segmentId,
  segmentName,
  onClose,
  onSent,
}: BatchEmailPreviewProps) {
  const [loading, setLoading] = useState(true)
  const [previews, setPreviews] = useState<EmailPreview[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [expandedPreview, setExpandedPreview] = useState<string | null>(null)

  // Send state
  const [sending, setSending] = useState(false)
  const [sendProgress, setSendProgress] = useState(0)
  const [sendResults, setSendResults] = useState<SendResult[]>([])
  const [sendComplete, setSendComplete] = useState(false)

  const { toast } = useToast()

  const fetchPreviews = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/outreach/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ segmentId, limit: 5 }),
      })

      if (res.ok) {
        const data = await res.json()
        setPreviews(data.previews || [])
        setTotalCount(data.totalCount || 0)
      } else {
        throw new Error('Failed to load previews')
      }
    } catch (error) {
      console.error('Error fetching previews:', error)
      toast({
        title: 'Error',
        description: 'Failed to load email previews',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [segmentId, toast])

  useEffect(() => {
    fetchPreviews()
  }, [fetchPreviews])

  const handleSend = async () => {
    if (totalCount === 0) return

    setSending(true)
    setSendProgress(0)
    setSendResults([])

    try {
      const res = await fetch('/api/outreach/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segmentId,
          maxSend: 50,
          delayMs: 1000,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setSendResults(data.results || [])
        setSendProgress(100)
        setSendComplete(true)

        toast({
          title: 'Batch Send Complete',
          description: `Sent ${data.totalSent} emails (${data.totalFailed} failed)`,
        })
      } else {
        const data = await res.json()
        throw new Error(data.error || 'Failed to send emails')
      }
    } catch (error) {
      console.error('Error sending emails:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send emails',
        variant: 'destructive',
      })
      setSending(false)
    }
  }

  const successCount = sendResults.filter((r) => r.success).length
  const failCount = sendResults.filter((r) => !r.success).length

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="bg-[#111827] border-gray-800 max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center space-x-2">
            <Mail className="h-5 w-5 text-cyan-400" />
            <span>Send to {segmentName}</span>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
          </div>
        ) : sendComplete ? (
          // Send Results View
          <div className="space-y-4">
            <div className="text-center py-6">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-xl font-medium text-white mb-2">
                Batch Send Complete!
              </h3>
              <div className="flex items-center justify-center space-x-6 text-lg">
                <span className="text-emerald-400">{successCount} sent</span>
                {failCount > 0 && (
                  <span className="text-red-400">{failCount} failed</span>
                )}
              </div>
            </div>

            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {sendResults.map((result) => (
                  <div
                    key={result.prospectId}
                    className={`p-3 rounded-lg border ${
                      result.success
                        ? 'bg-emerald-500/10 border-emerald-500/20'
                        : 'bg-red-500/10 border-red-500/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{result.companyName}</p>
                        <p className="text-sm text-gray-400">{result.recipientEmail}</p>
                      </div>
                      {result.success ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <div className="flex items-center text-red-400">
                          <XCircle className="h-5 w-5 mr-2" />
                          <span className="text-sm">{result.error}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button
                onClick={() => {
                  onSent()
                }}
                className="bg-cyan-500 hover:bg-cyan-600"
              >
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : sending ? (
          // Sending Progress View
          <div className="space-y-4 py-8">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-cyan-500 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">
                Sending Emails...
              </h3>
              <p className="text-gray-400">
                Please wait while we send your batch emails
              </p>
            </div>
            <Progress value={sendProgress} className="h-2" />
          </div>
        ) : (
          // Preview View
          <div className="space-y-4">
            {/* Summary */}
            <div className="flex items-center justify-between p-4 bg-[#0f172a] rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-cyan-500/20">
                  <Users className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-white font-medium">
                    {totalCount} prospect{totalCount !== 1 ? 's' : ''} with email
                  </p>
                  <p className="text-sm text-gray-400">
                    Showing {previews.length} preview{previews.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              {totalCount === 0 && (
                <Badge className="bg-amber-500/20 text-amber-400 border-0">
                  No emails to send
                </Badge>
              )}
            </div>

            {/* Email Previews */}
            {previews.length > 0 && (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3 pr-4">
                  {previews.map((preview) => (
                    <div
                      key={preview.prospectId}
                      className="bg-[#0f172a] rounded-lg border border-gray-800 overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedPreview(
                            expandedPreview === preview.prospectId
                              ? null
                              : preview.prospectId
                          )
                        }
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-800/50 transition-colors"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-white">
                              {preview.companyName}
                            </p>
                            {preview.usedFallback && (
                              <Badge className="bg-amber-500/20 text-amber-400 border-0 text-xs">
                                Fallback
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-400">
                            {preview.recipientEmail || 'No email'}
                          </p>
                          <p className="text-sm text-cyan-400 mt-1">
                            {preview.subject}
                          </p>
                        </div>
                        {expandedPreview === preview.prospectId ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </button>

                      {expandedPreview === preview.prospectId && (
                        <div className="px-4 pb-4 border-t border-gray-800">
                          <div className="mt-3 p-3 bg-gray-900 rounded-lg">
                            <p className="text-gray-300 whitespace-pre-wrap text-sm">
                              {preview.body}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* Warning */}
            {totalCount > 0 && (
              <div className="flex items-start space-x-3 p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-400 font-medium">Before you send</p>
                  <p className="text-sm text-gray-300 mt-1">
                    This will send up to {Math.min(totalCount, 50)} emails via your
                    connected Gmail account. Prospects will be marked as contacted.
                  </p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                disabled={totalCount === 0}
                className="bg-cyan-500 hover:bg-cyan-600"
              >
                <Mail className="h-4 w-4 mr-2" />
                Send to {Math.min(totalCount, 50)} Prospect
                {Math.min(totalCount, 50) !== 1 ? 's' : ''}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
