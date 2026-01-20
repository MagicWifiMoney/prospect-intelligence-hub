'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface SegmentRules {
  minIcpScore?: number
  maxIcpScore?: number
  minLeadScore?: number
  maxLeadScore?: number
  businessTypes?: string[]
  cities?: string[]
  hasWebsite?: boolean
  hasEmail?: boolean
  minReviews?: number
  minRating?: number
  isContacted?: boolean
  isHotLead?: boolean
  needsWebsite?: boolean
}

interface IcpSegment {
  id: string
  name: string
  description: string | null
  color: string
  rules: SegmentRules
  offerTemplateId: string | null
}

interface OfferTemplate {
  id: string
  name: string
  price: string | null
}

interface IcpSegmentFormProps {
  segment?: IcpSegment | null
  offers: OfferTemplate[]
  onClose: () => void
  onSave: () => void
}

const COLORS = [
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ef4444', // red
  '#ec4899', // pink
  '#3b82f6', // blue
  '#84cc16', // lime
]

const BUSINESS_TYPES = [
  'Painter',
  'HVAC',
  'Plumber',
  'Electrician',
  'Roofer',
  'Landscaper',
  'Contractor',
  'Bath Remodeler',
  'Kitchen Remodeler',
  'Flooring',
  'Windows & Doors',
  'Fencing',
]

export function IcpSegmentForm({ segment, offers, onClose, onSave }: IcpSegmentFormProps) {
  const isEditing = !!segment

  const [name, setName] = useState(segment?.name || '')
  const [description, setDescription] = useState(segment?.description || '')
  const [color, setColor] = useState(segment?.color || COLORS[0])
  const [offerTemplateId, setOfferTemplateId] = useState(segment?.offerTemplateId || '')

  // Rules
  const [minIcpScore, setMinIcpScore] = useState<number | undefined>(
    segment?.rules?.minIcpScore
  )
  const [minLeadScore, setMinLeadScore] = useState<number | undefined>(
    segment?.rules?.minLeadScore
  )
  const [businessTypes, setBusinessTypes] = useState<string[]>(
    segment?.rules?.businessTypes || []
  )
  const [businessTypeInput, setBusinessTypeInput] = useState('')
  const [hasWebsite, setHasWebsite] = useState<boolean | undefined>(
    segment?.rules?.hasWebsite
  )
  const [hasEmail, setHasEmail] = useState(segment?.rules?.hasEmail || false)
  const [minReviews, setMinReviews] = useState<number | undefined>(
    segment?.rules?.minReviews
  )
  const [minRating, setMinRating] = useState<number | undefined>(
    segment?.rules?.minRating
  )
  const [isContacted, setIsContacted] = useState<boolean | undefined>(
    segment?.rules?.isContacted
  )
  const [isHotLead, setIsHotLead] = useState(segment?.rules?.isHotLead || false)
  const [needsWebsite, setNeedsWebsite] = useState(segment?.rules?.needsWebsite || false)

  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const addBusinessType = (type: string) => {
    const trimmed = type.trim()
    if (trimmed && !businessTypes.includes(trimmed)) {
      setBusinessTypes([...businessTypes, trimmed])
    }
    setBusinessTypeInput('')
  }

  const removeBusinessType = (type: string) => {
    setBusinessTypes(businessTypes.filter((t) => t !== type))
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({ title: 'Error', description: 'Name is required', variant: 'destructive' })
      return
    }

    // Build rules object
    const rules: SegmentRules = {}
    if (minIcpScore !== undefined) rules.minIcpScore = minIcpScore
    if (minLeadScore !== undefined) rules.minLeadScore = minLeadScore
    if (businessTypes.length > 0) rules.businessTypes = businessTypes
    if (hasWebsite !== undefined) rules.hasWebsite = hasWebsite
    if (hasEmail) rules.hasEmail = true
    if (minReviews !== undefined) rules.minReviews = minReviews
    if (minRating !== undefined) rules.minRating = minRating
    if (isContacted !== undefined) rules.isContacted = isContacted
    if (isHotLead) rules.isHotLead = true
    if (needsWebsite) rules.needsWebsite = true

    setSaving(true)
    try {
      const url = isEditing ? `/api/icp-segments/${segment.id}` : '/api/icp-segments'
      const method = isEditing ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          color,
          rules,
          offerTemplateId: offerTemplateId || null,
        }),
      })

      if (res.ok) {
        toast({ title: isEditing ? 'Segment updated' : 'Segment created' })
        onSave()
      } else {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save segment',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="bg-[#111827] border-gray-800 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">
            {isEditing ? 'Edit ICP Segment' : 'Create ICP Segment'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Segment Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Big Spenders"
                className="bg-[#0f172a] border-gray-700"
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex space-x-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full transition-all ${
                      color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#111827]' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this segment..."
              className="bg-[#0f172a] border-gray-700 resize-none"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Linked Offer</Label>
            <Select value={offerTemplateId} onValueChange={setOfferTemplateId}>
              <SelectTrigger className="bg-[#0f172a] border-gray-700">
                <SelectValue placeholder="Select an offer template" />
              </SelectTrigger>
              <SelectContent className="bg-[#1f2937] border-gray-700">
                <SelectItem value="">None</SelectItem>
                {offers.map((offer) => (
                  <SelectItem key={offer.id} value={offer.id}>
                    {offer.name} {offer.price && `(${offer.price})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Rules Section */}
          <div className="border-t border-gray-800 pt-4">
            <h3 className="text-lg font-medium text-white mb-4">Segment Rules</h3>

            {/* Score Filters */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Min ICP Score</Label>
                  <span className="text-sm text-cyan-400">
                    {minIcpScore !== undefined ? minIcpScore : 'Any'}
                  </span>
                </div>
                <Slider
                  value={[minIcpScore ?? 0]}
                  onValueChange={([v]) => setMinIcpScore(v > 0 ? v : undefined)}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Min Lead Score</Label>
                  <span className="text-sm text-cyan-400">
                    {minLeadScore !== undefined ? minLeadScore : 'Any'}
                  </span>
                </div>
                <Slider
                  value={[minLeadScore ?? 0]}
                  onValueChange={([v]) => setMinLeadScore(v > 0 ? v : undefined)}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>

            {/* Business Types */}
            <div className="space-y-2 mb-4">
              <Label>Business Types</Label>
              <div className="flex space-x-2">
                <Select
                  value=""
                  onValueChange={(v) => addBusinessType(v)}
                >
                  <SelectTrigger className="bg-[#0f172a] border-gray-700 flex-1">
                    <SelectValue placeholder="Add business type" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1f2937] border-gray-700">
                    {BUSINESS_TYPES.filter((t) => !businessTypes.includes(t)).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={businessTypeInput}
                  onChange={(e) => setBusinessTypeInput(e.target.value)}
                  placeholder="Or type custom..."
                  className="bg-[#0f172a] border-gray-700 flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addBusinessType(businessTypeInput)
                    }
                  }}
                />
              </div>
              {businessTypes.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {businessTypes.map((type) => (
                    <Badge
                      key={type}
                      className="bg-cyan-500/20 text-cyan-400 border-0 pr-1"
                    >
                      {type}
                      <button
                        type="button"
                        onClick={() => removeBusinessType(type)}
                        className="ml-1 hover:text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Review & Rating Filters */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label>Min Reviews</Label>
                <Input
                  type="number"
                  value={minReviews ?? ''}
                  onChange={(e) => setMinReviews(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Any"
                  min={0}
                  className="bg-[#0f172a] border-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label>Min Rating</Label>
                <Input
                  type="number"
                  value={minRating ?? ''}
                  onChange={(e) => setMinRating(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Any"
                  min={1}
                  max={5}
                  step={0.5}
                  className="bg-[#0f172a] border-gray-700"
                />
              </div>
            </div>

            {/* Boolean Filters */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label>Website Status</Label>
                <Select
                  value={hasWebsite === undefined ? 'any' : hasWebsite ? 'yes' : 'no'}
                  onValueChange={(v) => {
                    if (v === 'any') setHasWebsite(undefined)
                    else if (v === 'yes') setHasWebsite(true)
                    else setHasWebsite(false)
                  }}
                >
                  <SelectTrigger className="bg-[#0f172a] border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1f2937] border-gray-700">
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="yes">Has Website</SelectItem>
                    <SelectItem value="no">No Website</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Contact Status</Label>
                <Select
                  value={isContacted === undefined ? 'any' : isContacted ? 'yes' : 'no'}
                  onValueChange={(v) => {
                    if (v === 'any') setIsContacted(undefined)
                    else if (v === 'yes') setIsContacted(true)
                    else setIsContacted(false)
                  }}
                >
                  <SelectTrigger className="bg-[#0f172a] border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1f2937] border-gray-700">
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="yes">Already Contacted</SelectItem>
                    <SelectItem value="no">Not Contacted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Checkbox Filters */}
            <div className="flex flex-wrap gap-6 mt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasEmail"
                  checked={hasEmail}
                  onCheckedChange={(c) => setHasEmail(c as boolean)}
                />
                <Label htmlFor="hasEmail">Must have email</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isHotLead"
                  checked={isHotLead}
                  onCheckedChange={(c) => setIsHotLead(c as boolean)}
                />
                <Label htmlFor="isHotLead">Hot leads only</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="needsWebsite"
                  checked={needsWebsite}
                  onCheckedChange={(c) => setNeedsWebsite(c as boolean)}
                />
                <Label htmlFor="needsWebsite">Needs website</Label>
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
            {isEditing ? 'Update' : 'Create'} Segment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
