
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
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
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center space-x-2 mb-2">
          <Star className="h-5 w-5 text-amber-400" />
          <h3 className="text-lg font-semibold text-white font-display">Hot Leads</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">Top prospects ready for outreach</p>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <Star className="h-5 w-5 text-amber-400" />
            <h3 className="text-lg font-semibold text-white font-display">Hot Leads</h3>
          </div>
          <p className="text-sm text-gray-500">Top prospects ready for outreach</p>
        </div>
        <Link href="/dashboard/hot-leads">
          <Button
            variant="outline"
            size="sm"
            className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white"
          >
            View All
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
      <div className="space-y-3">
        {hotLeads.length === 0 ? (
          <div className="text-center py-8">
            <Star className="h-12 w-12 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">No hot leads found.</p>
            <p className="text-sm text-gray-500">Prospects will appear here after AI analysis.</p>
          </div>
        ) : (
          hotLeads.map((lead, index) => (
            <motion.div
              key={lead.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-200 border border-transparent hover:border-white/10"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-semibold text-sm text-white">{lead.companyName}</h4>
                  {lead.leadScore && (
                    <Badge className="text-xs bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                      {Math.round(lead.leadScore)}% match
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
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
                      <Star className="h-3 w-3 fill-current text-amber-400" />
                      <span className="text-gray-400">{lead.googleRating} ({lead.reviewCount || 0})</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {lead.phone && (
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/10">
                    <Phone className="h-4 w-4" />
                  </Button>
                )}
                <Link href={`/dashboard/prospects/${lead.id}`}>
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-white/10">
                    View
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
