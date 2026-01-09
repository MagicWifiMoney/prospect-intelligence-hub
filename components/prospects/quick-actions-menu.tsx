
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  Copy,
  Phone,
  Mail,
  Globe,
  MapPin,
  Sparkles,
  CheckCircle2,
  Loader2,
  MoreVertical
} from 'lucide-react'

interface QuickActionsMenuProps {
  prospect: {
    id: string
    companyName: string
    phone?: string | null
    email?: string | null
    website?: string | null
    gbpUrl?: string | null
    contactedAt?: Date | null
  }
  onUpdate?: () => void
}

export function QuickActionsMenu({ prospect, onUpdate }: QuickActionsMenuProps) {
  const { toast } = useToast()
  const [generatingMessage, setGeneratingMessage] = useState(false)
  const [showMessageDialog, setShowMessageDialog] = useState(false)
  const [aiMessage, setAiMessage] = useState('')
  const [marking, setMarking] = useState(false)

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`
    })
  }

  const generateAIMessage = async () => {
    try {
      setGeneratingMessage(true)
      setShowMessageDialog(true)

      const response = await fetch(`/api/prospects/${prospect.id}/insights`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        
        // Generate a personalized outreach message
        const message = `Hi ${prospect.companyName} team,

I came across your business and was impressed by your ${data.insights.sentimentSummary || 'work in the community'}.

${data.insights.outreachStrategy || 'I wanted to reach out to discuss how we can help your business grow.'} 

${data.insights.valueProposition || 'We specialize in helping businesses like yours scale and improve operations.'}

Would you be open to a quick 15-minute call this week to explore how we can help?

Best regards`

        setAiMessage(message)
      } else {
        // Fallback generic message
        const fallbackMessage = `Hi ${prospect.companyName} team,

I came across your business and wanted to reach out about how we can help you grow your online presence and attract more customers.

We specialize in helping service businesses like yours scale through proven marketing and automation strategies.

Would you be open to a quick 15-minute call this week?

Best regards`
        setAiMessage(fallbackMessage)
      }
    } catch (error) {
      const fallbackMessage = `Hi ${prospect.companyName} team,

I came across your business and wanted to reach out about partnership opportunities.

Would you be open to a quick call this week?

Best regards`
      setAiMessage(fallbackMessage)
    } finally {
      setGeneratingMessage(false)
    }
  }

  const markAsContacted = async () => {
    try {
      setMarking(true)
      const response = await fetch(`/api/prospects/${prospect.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactedAt: new Date().toISOString() })
      })

      if (response.ok) {
        toast({
          title: "✅ Updated",
          description: "Marked as contacted"
        })
        onUpdate?.()
      } else {
        throw new Error('Failed to update')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      })
    } finally {
      setMarking(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {prospect.phone && (
            <DropdownMenuItem
              onClick={() => copyToClipboard(prospect.phone!, 'Phone number')}
            >
              <Phone className="mr-2 h-4 w-4" />
              Copy Phone Number
            </DropdownMenuItem>
          )}

          {prospect.email && (
            <DropdownMenuItem
              onClick={() => copyToClipboard(prospect.email!, 'Email')}
            >
              <Mail className="mr-2 h-4 w-4" />
              Copy Email
            </DropdownMenuItem>
          )}

          {prospect.website && (
            <>
              <DropdownMenuItem
                onClick={() => window.open(prospect.website!, '_blank')}
              >
                <Globe className="mr-2 h-4 w-4" />
                Open Website
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => copyToClipboard(prospect.website!, 'Website URL')}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Website
              </DropdownMenuItem>
            </>
          )}

          {prospect.gbpUrl && (
            <DropdownMenuItem
              onClick={() => window.open(prospect.gbpUrl!, '_blank')}
            >
              <MapPin className="mr-2 h-4 w-4" />
              Open Google Business
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={generateAIMessage}>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate AI Message
          </DropdownMenuItem>

          {!prospect.contactedAt && (
            <DropdownMenuItem onClick={markAsContacted} disabled={marking}>
              {marking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Marking...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark as Contacted
                </>
              )}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* AI Message Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span>AI-Generated Outreach Message</span>
            </DialogTitle>
            <DialogDescription>
              Personalized message for {prospect.companyName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {generatingMessage ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap text-sm">
                  {aiMessage}
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={() => {
                      copyToClipboard(aiMessage, 'Message')
                      setShowMessageDialog(false)
                    }}
                    className="flex-1"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Message
                  </Button>
                  {prospect.email && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        window.location.href = `mailto:${prospect.email}?subject=Partnership Opportunity&body=${encodeURIComponent(aiMessage)}`
                      }}
                      className="flex-1"
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Open in Email
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
