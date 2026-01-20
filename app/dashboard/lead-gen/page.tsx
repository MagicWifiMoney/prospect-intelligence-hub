'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Globe,
  TrendingUp,
  DollarSign,
  MapPin,
  Users,
  Star,
  Target,
  Lightbulb,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'

interface LeadGenOpportunity {
  category: string
  count: number
  avgScore: number
  avgRating: number | null
  estimatedLeadValue: number
  topCities: { city: string; count: number }[]
  marketGapPercent: number
  noWebsiteCount: number
}

interface CategoryProspect {
  id: string
  companyName: string
  city: string
  leadGenScore: number
  website: string | null
  googleRating: number | null
  reviewCount: number | null
}

export default function LeadGenPage() {
  const [opportunities, setOpportunities] = useState<LeadGenOpportunity[]>([])
  const [categoryProspects, setCategoryProspects] = useState<Record<string, CategoryProspect[]>>({})
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchOpportunities = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/prospects/lead-gen')

      if (response.ok) {
        const data = await response.json()
        setOpportunities(data.opportunities || [])
        setCategoryProspects(data.categoryProspects || {})
      }
    } catch (error) {
      console.error('Error fetching lead gen opportunities:', error)
      toast({
        title: 'Error',
        description: 'Failed to load lead gen opportunities',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchOpportunities()
  }, [fetchOpportunities])

  const getOpportunityLevel = (score: number, leadValue: number, count: number) => {
    const index = score * leadValue * Math.log(count + 1) / 1000
    if (index > 10) return { label: 'Excellent', color: 'bg-green-500/20 text-green-400 border-green-500/30' }
    if (index > 5) return { label: 'Great', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' }
    if (index > 2) return { label: 'Good', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' }
    return { label: 'Moderate', color: 'bg-white/10 text-gray-300 border-white/20' }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-white/5 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-2 mb-2 text-white font-display">
              <Globe className="h-8 w-8 text-cyan-400" />
              <span>Lead Gen Opportunities</span>
            </h1>
            <p className="text-gray-400">
              Niches worth building a lead generation website for - ranked by opportunity
            </p>
          </div>
        </div>

        {/* Description Card */}
        <div className="backdrop-blur-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/5 border border-cyan-500/20 rounded-2xl p-6">
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-cyan-400 mb-1">What This Shows</h3>
              <p className="text-sm text-gray-300">
                These categories represent opportunities to build SEO lead generation websites. When you rank a site
                for "[category] [city]" keywords, you can sell the leads back to local businesses or offer them
                as part of a monthly retainer package.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-cyan-400 mb-1">How to Use This Data</h3>
              <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                <li><strong className="text-white">High Lead Value:</strong> Categories like roofing and HVAC pay $100-150 per lead</li>
                <li><strong className="text-white">Market Gap %:</strong> Shows what % of businesses have no website - less competition</li>
                <li><strong className="text-white">Top Cities:</strong> Target cities with most prospects for that service</li>
                <li><strong className="text-white">Build + Rank + Sell:</strong> Create a simple site, rank it locally, sell leads monthly</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Categories Analyzed</h3>
            <Target className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">{opportunities.length}</div>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Top Lead Value</h3>
            <DollarSign className="h-4 w-4 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-green-400">
            ${opportunities[0]?.estimatedLeadValue || 0}/lead
          </div>
          <p className="text-xs text-gray-500">
            {opportunities[0]?.category || 'N/A'}
          </p>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Biggest Market</h3>
            <Users className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {Math.max(...opportunities.map(o => o.count))} prospects
          </div>
          <p className="text-xs text-gray-500">
            {opportunities.find(o => o.count === Math.max(...opportunities.map(x => x.count)))?.category || 'N/A'}
          </p>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Avg Market Gap</h3>
            <TrendingUp className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">
            {Math.round(opportunities.reduce((sum, o) => sum + o.marketGapPercent, 0) / opportunities.length || 0)}%
          </div>
          <p className="text-xs text-gray-500">
            Without websites
          </p>
        </div>
      </div>

      {/* Opportunity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {opportunities.map((opp, index) => {
          const level = getOpportunityLevel(opp.avgScore, opp.estimatedLeadValue, opp.count)
          const prospects = categoryProspects[opp.category] || []

          return (
            <motion.div
              key={opp.category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 h-full hover:bg-white/10 transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white capitalize">{opp.category}</h3>
                  <Badge className={`${level.color} border`}>{level.label}</Badge>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  {opp.count} prospects in database
                </p>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-500">Lead Value</p>
                    <p className="font-bold text-green-400 text-lg">${opp.estimatedLeadValue}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Market Gap</p>
                    <p className="font-bold text-amber-400 text-lg">{opp.marketGapPercent}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Avg Rating</p>
                    <p className="font-medium text-white flex items-center">
                      <Star className="h-4 w-4 text-amber-400 mr-1" />
                      {opp.avgRating || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Opp Score</p>
                    <p className="font-bold text-cyan-400">{opp.avgScore}</p>
                  </div>
                </div>

                {/* Top Cities */}
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">Top Cities</p>
                  <div className="flex flex-wrap gap-1">
                    {opp.topCities.slice(0, 4).map((city) => (
                      <Badge key={city.city} className="text-xs bg-white/10 text-gray-300 border-white/20">
                        <MapPin className="h-3 w-3 mr-1" />
                        {city.city || 'Unknown'} ({city.count})
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Sample Prospects */}
                {prospects.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-2">Sample Prospects</p>
                    <div className="space-y-1">
                      {prospects.slice(0, 3).map((prospect) => (
                        <Link
                          key={prospect.id}
                          href={`/dashboard/prospects/${prospect.id}`}
                          className="block text-xs hover:bg-white/10 p-1 rounded transition-colors text-gray-300"
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate">{prospect.companyName}</span>
                            <span className="text-gray-500">
                              {prospect.website ? '🌐' : '❌'} {prospect.city}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div className="pt-2">
                  <Link href={`/dashboard/prospects?businessType=${encodeURIComponent(opp.category)}`}>
                    <Button variant="outline" className="w-full bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white" size="sm">
                      <Lightbulb className="h-4 w-4 mr-2" />
                      View All {opp.category} Prospects
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {opportunities.length === 0 && (
        <div className="text-center py-12">
          <Globe className="h-12 w-12 mx-auto text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No opportunities found</h3>
          <p className="text-gray-500 mb-4">
            Run the enhanced scoring script to analyze lead gen opportunities
          </p>
        </div>
      )}
    </div>
  )
}
