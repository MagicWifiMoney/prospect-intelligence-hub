'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Loader2, X, Plus, Info } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface OfferTemplate {
  id: string
  name: string
  description: string | null
  price: string | null
  features: string[]
  emailSubject: string
  emailBody: string
}

interface OfferTemplateFormProps {
  offer?: OfferTemplate | null
  onClose: () => void
  onSave: () => void
}

const TEMPLATE_VARIABLES = [
  { name: '{{companyName}}', desc: 'Company name' },
  { name: '{{ownerName}}', desc: 'Owner/contact name' },
  { name: '{{businessType}}', desc: 'Business type' },
  { name: '{{city}}', desc: 'City' },
  { name: '{{googleRating}}', desc: 'Google rating' },
  { name: '{{reviewCount}}', desc: 'Review count' },
  { name: '{{yelpRating}}', desc: 'Yelp rating' },
  { name: '{{facebookRating}}', desc: 'Facebook rating' },
  { name: '{{auditPageUrl}}', desc: 'Audit page URL' },
  { name: '{{auditPassword}}', desc: 'Audit password' },
]

export function OfferTemplateForm({ offer, onClose, onSave }: OfferTemplateFormProps) {
  const isEditing = !!offer

  const [name, setName] = useState(offer?.name || '')
  const [description, setDescription] = useState(offer?.description || '')
  const [price, setPrice] = useState(offer?.price || '')
  const [features, setFeatures] = useState<string[]>(offer?.features || [])
  const [featureInput, setFeatureInput] = useState('')
  const [emailSubject, setEmailSubject] = useState(
    offer?.emailSubject || 'Quick question about {{companyName}}'
  )
  const [emailBody, setEmailBody] = useState(
    offer?.emailBody ||
    `Hi {{ownerName}},

I came across {{companyName}} and was impressed by your {{googleRating}}-star rating in {{city}}.

I help {{businessType}} businesses like yours grow through [YOUR OFFER]. I noticed a few opportunities that could help you attract more of the right customers.

Would you be open to a 15-minute call this week?

Best regards`
  )

  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const addFeature = () => {
    const trimmed = featureInput.trim()
    if (trimmed && !features.includes(trimmed)) {
      setFeatures([...features, trimmed])
    }
    setFeatureInput('')
  }

  const removeFeature = (feature: string) => {
    setFeatures(features.filter((f) => f !== feature))
  }

  const insertVariable = (variable: string, field: 'subject' | 'body') => {
    if (field === 'subject') {
      setEmailSubject((prev) => prev + variable)
    } else {
      setEmailBody((prev) => prev + variable)
    }
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({ title: 'Error', description: 'Name is required', variant: 'destructive' })
      return
    }
    if (!emailSubject.trim()) {
      toast({ title: 'Error', description: 'Email subject is required', variant: 'destructive' })
      return
    }
    if (!emailBody.trim()) {
      toast({ title: 'Error', description: 'Email body is required', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const url = isEditing ? `/api/offers/${offer.id}` : '/api/offers'
      const method = isEditing ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          price: price.trim() || null,
          features,
          emailSubject: emailSubject.trim(),
          emailBody: emailBody.trim(),
        }),
      })

      if (res.ok) {
        toast({ title: isEditing ? 'Offer updated' : 'Offer created' })
        onSave()
      } else {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save offer',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[#111827] border-gray-800 max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">
            {isEditing ? 'Edit Offer Template' : 'Create Offer Template'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Offer Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Website Package"
                className="bg-[#0f172a] border-gray-700"
              />
            </div>

            <div className="space-y-2">
              <Label>Price</Label>
              <Input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g., $997/mo or $2,500 one-time"
                className="bg-[#0f172a] border-gray-700"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this offer..."
              className="bg-[#0f172a] border-gray-700 resize-none"
              rows={2}
            />
          </div>

          {/* Features */}
          <div className="space-y-2">
            <Label>Features/Benefits</Label>
            <div className="flex space-x-2">
              <Input
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                placeholder="Add a feature..."
                className="bg-[#0f172a] border-gray-700"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addFeature()
                  }
                }}
              />
              <Button type="button" onClick={addFeature} variant="secondary">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {features.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {features.map((feature, i) => (
                  <Badge
                    key={i}
                    className="bg-emerald-500/20 text-emerald-400 border-0 pr-1"
                  >
                    {feature}
                    <button
                      type="button"
                      onClick={() => removeFeature(feature)}
                      className="ml-1 hover:text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Email Template Section */}
          <div className="border-t border-gray-800 pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Email Template</h3>
              <div className="flex items-center text-sm text-gray-400">
                <Info className="h-4 w-4 mr-1" />
                Use variables for personalization
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-gray-400 text-sm">Insert Variables:</Label>
                {emailBody.includes('[INSERT LOOM LINK HERE]') && (
                  <Badge variant="outline" className="text-amber-400 border-amber-400/50 bg-amber-400/10">
                    Loom Placeholder Detected
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {TEMPLATE_VARIABLES.map((v) => (
                  <Button
                    key={v.name}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => insertVariable(v.name, 'body')}
                    className="text-xs"
                    title={v.desc}
                  >
                    {v.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Email Subject</Label>
                <Input
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Subject line with {{variables}}"
                  className="bg-[#0f172a] border-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label>Email Body</Label>
                <Textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Email body with {{variables}}..."
                  className="bg-[#0f172a] border-gray-700 font-mono text-sm"
                  rows={12}
                />
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="border-t border-gray-800 pt-4">
            <h3 className="text-lg font-medium text-white mb-4">Preview</h3>
            <div className="bg-[#0f172a] rounded-lg p-4 space-y-3">
              <div className="border-b border-gray-700 pb-2">
                <span className="text-gray-400 text-sm">Subject:</span>
                <p className="text-white font-medium">
                  {emailSubject
                    .replace(/\{\{companyName\}\}/g, 'Acme Painting')
                    .replace(/\{\{ownerName\}\}/g, 'John')
                    .replace(/\{\{businessType\}\}/g, 'Painter')
                    .replace(/\{\{city\}\}/g, 'Minneapolis')
                    .replace(/\{\{googleRating\}\}/g, '4.8')
                    .replace(/\{\{reviewCount\}\}/g, '127')}
                </p>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Body:</span>
                <p className="text-gray-300 whitespace-pre-wrap text-sm mt-1">
                  {emailBody
                    .replace(/\{\{companyName\}\}/g, 'Acme Painting')
                    .replace(/\{\{ownerName\}\}/g, 'John')
                    .replace(/\{\{businessType\}\}/g, 'Painter')
                    .replace(/\{\{city\}\}/g, 'Minneapolis')
                    .replace(/\{\{googleRating\}\}/g, '4.8')
                    .replace(/\{\{reviewCount\}\}/g, '127')}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-cyan-500 hover:bg-cyan-600"
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? 'Update' : 'Create'} Offer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
