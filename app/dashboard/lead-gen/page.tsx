'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Globe,
  TrendingUp,
  DollarSign,
  MapPin,
  Users,
  ExternalLink,
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

  useEffect(() => {
    fetchOpportunities()
  }, [])

  const fetchOpportunities = async () => {
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
  }

  const getOpportunityLevel = (score: number, leadValue: number, count: number) => {
    const index = score * leadValue * Math.log(count + 1) / 1000
    if (index > 10) return { label: 'Excellent', color: 'bg-green-100 text-green-800 border-green-200' }
    if (index > 5) return { label: 'Great', color: 'bg-blue-100 text-blue-800 border-blue-200' }
    if (index > 2) return { label: 'Good', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
    return { label: 'Moderate', color: 'bg-gray-100 text-gray-800 border-gray-200' }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-muted rounded animate-pulse" />
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
            <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-2 mb-2">
              <Globe className="h-8 w-8 text-blue-500" />
              <span>Lead Gen Opportunities</span>
            </h1>
            <p className="text-muted-foreground">
              Niches worth building a lead generation website for - ranked by opportunity
            </p>
          </div>
        </div>

        {/* Description Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-900">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">What This Shows</h3>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  These categories represent opportunities to build SEO lead generation websites. When you rank a site
                  for "[category] [city]" keywords, you can sell the leads back to local businesses or offer them
                  as part of a monthly retainer package.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">How to Use This Data</h3>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                  <li><strong>High Lead Value:</strong> Categories like roofing and HVAC pay $100-150 per lead</li>
                  <li><strong>Market Gap %:</strong> Shows what % of businesses have no website - less competition</li>
                  <li><strong>Top Cities:</strong> Target cities with most prospects for that service</li>
                  <li><strong>Build + Rank + Sell:</strong> Create a simple site, rank it locally, sell leads monthly</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories Analyzed</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{opportunities.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Lead Value</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${opportunities[0]?.estimatedLeadValue || 0}/lead
            </div>
            <p className="text-xs text-muted-foreground">
              {opportunities[0]?.category || 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Biggest Market</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.max(...opportunities.map(o => o.count))} prospects
            </div>
            <p className="text-xs text-muted-foreground">
              {opportunities.find(o => o.count === Math.max(...opportunities.map(x => x.count)))?.category || 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Market Gap</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(opportunities.reduce((sum, o) => sum + o.marketGapPercent, 0) / opportunities.length || 0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Without websites
            </p>
          </CardContent>
        </Card>
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
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg capitalize">{opp.category}</CardTitle>
                    <Badge className={level.color}>{level.label}</Badge>
                  </div>
                  <CardDescription>
                    {opp.count} prospects in database
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Lead Value</p>
                      <p className="font-bold text-green-600 text-lg">${opp.estimatedLeadValue}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Market Gap</p>
                      <p className="font-bold text-amber-600 text-lg">{opp.marketGapPercent}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Avg Rating</p>
                      <p className="font-medium flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 mr-1" />
                        {opp.avgRating || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Opp Score</p>
                      <p className="font-bold text-blue-600">{opp.avgScore}</p>
                    </div>
                  </div>

                  {/* Top Cities */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Top Cities</p>
                    <div className="flex flex-wrap gap-1">
                      {opp.topCities.slice(0, 4).map((city) => (
                        <Badge key={city.city} variant="outline" className="text-xs">
                          <MapPin className="h-3 w-3 mr-1" />
                          {city.city || 'Unknown'} ({city.count})
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Sample Prospects */}
                  {prospects.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Sample Prospects</p>
                      <div className="space-y-1">
                        {prospects.slice(0, 3).map((prospect) => (
                          <Link
                            key={prospect.id}
                            href={`/dashboard/prospects/${prospect.id}`}
                            className="block text-xs hover:bg-muted p-1 rounded transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <span className="truncate">{prospect.companyName}</span>
                              <span className="text-muted-foreground">
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
                    <Button variant="outline" className="w-full" size="sm">
                      <Lightbulb className="h-4 w-4 mr-2" />
                      View All {opp.category} Prospects
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {opportunities.length === 0 && (
        <div className="text-center py-12">
          <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No opportunities found</h3>
          <p className="text-muted-foreground mb-4">
            Run the enhanced scoring script to analyze lead gen opportunities
          </p>
        </div>
      )}
    </div>
  )
}
