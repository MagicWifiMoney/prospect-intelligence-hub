'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Users, Mail, Target, DollarSign, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { IcpSegmentCard } from '@/components/outreach/icp-segment-card'
import { IcpSegmentForm } from '@/components/outreach/icp-segment-form'
import { OfferTemplateForm } from '@/components/outreach/offer-template-form'
import { BatchEmailPreview } from '@/components/outreach/batch-email-preview'

interface IcpSegment {
  id: string
  name: string
  description: string | null
  color: string
  rules: Record<string, unknown>
  offerTemplateId: string | null
  offerTemplate: {
    id: string
    name: string
    price: string | null
  } | null
  assignedCount: number
  matchingCount: number
  createdAt: string
}

interface OfferTemplate {
  id: string
  name: string
  description: string | null
  price: string | null
  features: string[]
  emailSubject: string
  emailBody: string
  segmentCount: number
  createdAt: string
}

export default function OutreachPage() {
  const [segments, setSegments] = useState<IcpSegment[]>([])
  const [offers, setOffers] = useState<OfferTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('segments')

  // Modal states
  const [showSegmentForm, setShowSegmentForm] = useState(false)
  const [editingSegment, setEditingSegment] = useState<IcpSegment | null>(null)
  const [showOfferForm, setShowOfferForm] = useState(false)
  const [editingOffer, setEditingOffer] = useState<OfferTemplate | null>(null)
  const [sendingToSegment, setSendingToSegment] = useState<IcpSegment | null>(null)

  const { toast } = useToast()

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [segmentsRes, offersRes] = await Promise.all([
        fetch('/api/icp-segments'),
        fetch('/api/offers'),
      ])

      if (segmentsRes.ok) {
        const data = await segmentsRes.json()
        setSegments(data.segments || [])
      }

      if (offersRes.ok) {
        const data = await offersRes.json()
        setOffers(data.offers || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load outreach data',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDeleteSegment = async (segmentId: string) => {
    try {
      const res = await fetch(`/api/icp-segments/${segmentId}`, { method: 'DELETE' })
      if (res.ok) {
        setSegments((prev) => prev.filter((s) => s.id !== segmentId))
        toast({ title: 'Segment deleted' })
      } else {
        throw new Error('Failed to delete')
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete segment', variant: 'destructive' })
    }
  }

  const handleApplySegment = async (segmentId: string) => {
    try {
      const res = await fetch(`/api/icp-segments/${segmentId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clearOthers: true }),
      })
      if (res.ok) {
        const data = await res.json()
        toast({ title: 'Segment applied', description: `${data.updated} prospects tagged` })
        fetchData()
      } else {
        throw new Error('Failed to apply')
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to apply segment rules', variant: 'destructive' })
    }
  }

  const handleDeleteOffer = async (offerId: string) => {
    try {
      const res = await fetch(`/api/offers/${offerId}`, { method: 'DELETE' })
      if (res.ok) {
        setOffers((prev) => prev.filter((o) => o.id !== offerId))
        toast({ title: 'Offer deleted' })
      } else {
        throw new Error('Failed to delete')
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete offer', variant: 'destructive' })
    }
  }

  // Stats
  const totalProspects = segments.reduce((sum, s) => sum + s.matchingCount, 0)
  const uniqueProspects = new Set(segments.flatMap(() => [])).size || totalProspects

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">ICP Outreach</h1>
          <p className="text-gray-400 mt-1">
            Segment prospects and send targeted batch outreach
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#111827] border-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">ICP Segments</p>
                <p className="text-2xl font-bold text-white">{segments.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-cyan-500/20">
                <Target className="h-6 w-6 text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111827] border-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Matching</p>
                <p className="text-2xl font-bold text-white">{uniqueProspects}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/20">
                <Users className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111827] border-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Offer Templates</p>
                <p className="text-2xl font-bold text-white">{offers.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/20">
                <DollarSign className="h-6 w-6 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111827] border-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Ready to Send</p>
                <p className="text-2xl font-bold text-white">
                  {segments.filter((s) => s.offerTemplate).length}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-purple-500/20">
                <Mail className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-[#111827] border border-gray-800">
          <TabsTrigger value="segments" className="data-[state=active]:bg-cyan-500/20">
            ICP Segments
          </TabsTrigger>
          <TabsTrigger value="offers" className="data-[state=active]:bg-cyan-500/20">
            Offer Templates
          </TabsTrigger>
        </TabsList>

        {/* Segments Tab */}
        <TabsContent value="segments" className="space-y-6">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setEditingSegment(null)
                setShowSegmentForm(true)
              }}
              className="bg-cyan-500 hover:bg-cyan-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              New ICP Segment
            </Button>
          </div>

          {segments.length === 0 ? (
            <Card className="bg-[#111827] border-gray-800">
              <CardContent className="py-12 text-center">
                <Target className="h-12 w-12 mx-auto text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No ICP Segments</h3>
                <p className="text-gray-400 mb-4">
                  Create your first ICP segment to start targeting prospects
                </p>
                <Button
                  onClick={() => setShowSegmentForm(true)}
                  className="bg-cyan-500 hover:bg-cyan-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Segment
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {segments.map((segment) => (
                <IcpSegmentCard
                  key={segment.id}
                  segment={segment}
                  onEdit={() => {
                    setEditingSegment(segment)
                    setShowSegmentForm(true)
                  }}
                  onDelete={() => handleDeleteSegment(segment.id)}
                  onApply={() => handleApplySegment(segment.id)}
                  onSend={() => setSendingToSegment(segment)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Offers Tab */}
        <TabsContent value="offers" className="space-y-6">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setEditingOffer(null)
                setShowOfferForm(true)
              }}
              className="bg-cyan-500 hover:bg-cyan-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Offer Template
            </Button>
          </div>

          {offers.length === 0 ? (
            <Card className="bg-[#111827] border-gray-800">
              <CardContent className="py-12 text-center">
                <DollarSign className="h-12 w-12 mx-auto text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No Offer Templates</h3>
                <p className="text-gray-400 mb-4">
                  Create offer templates to use in your outreach campaigns
                </p>
                <Button
                  onClick={() => setShowOfferForm(true)}
                  className="bg-cyan-500 hover:bg-cyan-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Offer
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {offers.map((offer) => (
                <Card key={offer.id} className="bg-[#111827] border-gray-800">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-white">{offer.name}</CardTitle>
                        {offer.price && (
                          <Badge className="mt-2 bg-emerald-500/20 text-emerald-400 border-0">
                            {offer.price}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {offer.description && (
                      <CardDescription className="text-gray-400">
                        {offer.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {offer.features.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-400 mb-2">Features:</p>
                        <ul className="space-y-1">
                          {offer.features.slice(0, 3).map((feature, i) => (
                            <li key={i} className="text-sm text-gray-300 flex items-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mr-2" />
                              {feature}
                            </li>
                          ))}
                          {offer.features.length > 3 && (
                            <li className="text-sm text-gray-500">
                              +{offer.features.length - 3} more
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

                    <div className="text-sm text-gray-400">
                      Used in {offer.segmentCount} segment{offer.segmentCount !== 1 ? 's' : ''}
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingOffer(offer)
                          setShowOfferForm(true)
                        }}
                        className="flex-1"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteOffer(offer.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {showSegmentForm && (
        <IcpSegmentForm
          segment={editingSegment}
          offers={offers}
          onClose={() => {
            setShowSegmentForm(false)
            setEditingSegment(null)
          }}
          onSave={() => {
            setShowSegmentForm(false)
            setEditingSegment(null)
            fetchData()
          }}
        />
      )}

      {showOfferForm && (
        <OfferTemplateForm
          offer={editingOffer}
          onClose={() => {
            setShowOfferForm(false)
            setEditingOffer(null)
          }}
          onSave={() => {
            setShowOfferForm(false)
            setEditingOffer(null)
            fetchData()
          }}
        />
      )}

      {sendingToSegment && (
        <BatchEmailPreview
          segmentId={sendingToSegment.id}
          segmentName={sendingToSegment.name}
          onClose={() => setSendingToSegment(null)}
          onSent={() => {
            setSendingToSegment(null)
            fetchData()
          }}
        />
      )}
    </div>
  )
}
