
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Star, ArrowRight, MapPin, Phone } from 'lucide-react'
import { motion } from 'framer-motion'

interface HotLead {
  id: string
  companyName: string
  businessType: string | null
  city: string | null
  leadScore: number | null
  googleRating: number | null
  reviewCount: number | null
  phone: string | null
}

export function HotLeadsPreview() {
  const [hotLeads, setHotLeads] = useState<HotLead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchHotLeads() {
      try {
        const response = await fetch('/api/prospects/hot-leads?limit=3')
        if (response.ok) {
          const data = await response.json()
          setHotLeads(data.prospects || [])
        }
      } catch (error) {
        console.error('Error fetching hot leads:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchHotLeads()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Star className="h-5 w-5 text-orange-500" />
            <span>Hot Leads</span>
          </CardTitle>
          <CardDescription>Top prospects ready for outreach</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-orange-500" />
              <span>Hot Leads</span>
            </CardTitle>
            <CardDescription>Top prospects ready for outreach</CardDescription>
          </div>
          <Link href="/dashboard/hot-leads">
            <Button variant="outline" size="sm">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {hotLeads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hot leads found.</p>
              <p className="text-sm">Prospects will appear here after AI analysis.</p>
            </div>
          ) : (
            hotLeads.map((lead, index) => (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-semibold text-sm">{lead.companyName}</h4>
                    {lead.leadScore && (
                      <Badge variant="secondary" className="text-xs">
                        {Math.round(lead.leadScore)}% match
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    {lead.businessType && (
                      <span className="capitalize">{lead.businessType}</span>
                    )}
                    {lead.city && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3" />
                        <span>{lead.city}</span>
                      </div>
                    )}
                    {lead.googleRating && (
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 fill-current text-yellow-500" />
                        <span>{lead.googleRating} ({lead.reviewCount || 0})</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {lead.phone && (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Phone className="h-4 w-4" />
                    </Button>
                  )}
                  <Link href={`/dashboard/prospects/${lead.id}`}>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
