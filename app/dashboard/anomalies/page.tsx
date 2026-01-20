'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertTriangle,
  Globe,
  Phone,
  TrendingDown,
  TrendingUp,
  Search,
  Filter,
  ExternalLink
} from 'lucide-react'

interface Prospect {
  id: string
  companyName: string
  phone?: string
  website?: string
  gbpUrl?: string
  reviewCount?: number
  googleRating?: number
  anomaliesDetected?: string
  leadScore?: number
  city?: string
  businessType?: string
  isHotLead?: boolean
}

// Helper to parse anomaliesDetected string into array
const parseAnomalyFlags = (anomaliesDetected?: string): string[] => {
  if (!anomaliesDetected) return []
  // Map the stored anomaly descriptions to our internal flag names
  return anomaliesDetected.split(', ').map(flag => {
    const lowerFlag = flag.toLowerCase()
    if (lowerFlag.includes('no website') || lowerFlag.includes('missing website')) return 'no_website'
    if (lowerFlag.includes('personal') || lowerFlag.includes('cell')) return 'personal_phone'
    if (lowerFlag.includes('spike') || lowerFlag.includes('surge')) return 'review_spike'
    if (lowerFlag.includes('drop') || lowerFlag.includes('declin')) return 'review_drop'
    if (lowerFlag.includes('low rating') || lowerFlag.includes('poor rating')) return 'low_rating'
    if (lowerFlag.includes('low review') || lowerFlag.includes('few review')) return 'low_reviews'
    return flag
  })
}

export default function AnomaliesPage() {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [filteredProspects, setFilteredProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [anomalyFilter, setAnomalyFilter] = useState('all')

  const fetchAnomalies = useCallback(async () => {
    try {
      const response = await fetch('/api/prospects?hasAnomalies=true&limit=100')
      if (!response.ok) throw new Error('Failed to fetch anomalies')
      const data = await response.json()
      setProspects(data.prospects || [])
    } catch (error) {
      console.error('Error fetching anomalies:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const filterProspects = useCallback(() => {
    let filtered = [...prospects]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.city?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Anomaly type filter
    if (anomalyFilter !== 'all') {
      filtered = filtered.filter(p => {
        const flags = parseAnomalyFlags(p.anomaliesDetected)
        return flags.includes(anomalyFilter)
      })
    }

    setFilteredProspects(filtered)
  }, [prospects, searchTerm, anomalyFilter])

  useEffect(() => {
    fetchAnomalies()
  }, [fetchAnomalies])

  useEffect(() => {
    filterProspects()
  }, [filterProspects])

  const getAnomalyIcon = (flag: string) => {
    switch (flag) {
      case 'no_website':
        return <Globe className="h-4 w-4" />
      case 'personal_phone':
        return <Phone className="h-4 w-4" />
      case 'review_spike':
        return <TrendingUp className="h-4 w-4" />
      case 'review_drop':
        return <TrendingDown className="h-4 w-4" />
      case 'low_rating':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getAnomalyLabel = (flag: string) => {
    switch (flag) {
      case 'no_website':
        return 'No Website'
      case 'personal_phone':
        return 'Personal Phone'
      case 'review_spike':
        return 'Review Spike'
      case 'review_drop':
        return 'Review Drop'
      case 'low_rating':
        return 'Low Rating'
      default:
        return flag
    }
  }

  const anomalyCounts = {
    no_website: prospects.filter(p => parseAnomalyFlags(p.anomaliesDetected).includes('no_website')).length,
    personal_phone: prospects.filter(p => parseAnomalyFlags(p.anomaliesDetected).includes('personal_phone')).length,
    review_spike: prospects.filter(p => parseAnomalyFlags(p.anomaliesDetected).includes('review_spike')).length,
    review_drop: prospects.filter(p => parseAnomalyFlags(p.anomaliesDetected).includes('review_drop')).length,
    low_rating: prospects.filter(p => parseAnomalyFlags(p.anomaliesDetected).includes('low_rating')).length,
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-64 bg-white/5 rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-white/5 rounded-2xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-2 mb-2 text-white font-display">
          <AlertTriangle className="h-8 w-8 text-red-400" />
          <span>Anomaly Detection</span>
        </h1>
        <p className="text-gray-400 mb-4">
          Identify prospects with unusual patterns or missing information
        </p>

        {/* Page Description */}
        <div className="backdrop-blur-xl bg-gradient-to-r from-red-500/10 to-orange-500/5 border border-red-500/20 rounded-2xl p-6">
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-red-400 mb-1">What Are Anomalies</h3>
              <p className="text-sm text-gray-300">
                Anomalies are data quality flags automatically detected in your prospect database: missing websites, personal phone numbers (vs business lines),
                low review counts (under 5 reviews), declining ratings (recent reviews worse than overall), or stagnant engagement (no new reviews in 6+ months).
                These signal businesses that may be struggling, unprofessional, or in need of digital presence improvement.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-red-400 mb-1">How to Leverage Anomaly Data</h3>
              <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                <li><strong className="text-white">No Website:</strong> Prime candidates for web design services - "I noticed you don't have a website. Here's what you're missing..."</li>
                <li><strong className="text-white">Personal Phone:</strong> Pitch call tracking, business line setup, or professional communication systems</li>
                <li><strong className="text-white">Low Review Count:</strong> Opportunity to sell reputation management or review generation services</li>
                <li><strong className="text-white">Declining Ratings:</strong> Urgent intervention opportunity - these businesses need help NOW before losing more customers</li>
                <li><strong className="text-white">Multiple Flags:</strong> Prospects with 2+ anomalies are distressed businesses with high urgency and may convert faster</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">No Website</h3>
            <Globe className="h-4 w-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-white">{anomalyCounts.no_website}</div>
          <p className="text-xs text-gray-500">Easy wins</p>
        </div>
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Personal Phone</h3>
            <Phone className="h-4 w-4 text-orange-400" />
          </div>
          <div className="text-2xl font-bold text-white">{anomalyCounts.personal_phone}</div>
          <p className="text-xs text-gray-500">Unprofessional</p>
        </div>
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Review Spikes</h3>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-white">{anomalyCounts.review_spike}</div>
          <p className="text-xs text-gray-500">Growing fast</p>
        </div>
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Review Drops</h3>
            <TrendingDown className="h-4 w-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-white">{anomalyCounts.review_drop}</div>
          <p className="text-xs text-gray-500">Declining</p>
        </div>
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Low Ratings</h3>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">{anomalyCounts.low_rating}</div>
          <p className="text-xs text-gray-500">Need help</p>
        </div>
      </div>

      {/* Filters */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Filter Anomalies</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search by business name or city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              />
            </div>
          </div>
          <Select value={anomalyFilter} onValueChange={setAnomalyFilter}>
            <SelectTrigger className="w-full sm:w-[200px] bg-white/5 border-white/10 text-white">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Anomalies" />
            </SelectTrigger>
            <SelectContent className="bg-[#0d1424] border-white/10">
              <SelectItem value="all">All Anomalies</SelectItem>
              <SelectItem value="no_website">No Website</SelectItem>
              <SelectItem value="personal_phone">Personal Phone</SelectItem>
              <SelectItem value="review_spike">Review Spike</SelectItem>
              <SelectItem value="review_drop">Review Drop</SelectItem>
              <SelectItem value="low_rating">Low Rating</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            {filteredProspects.length} Prospects with Anomalies
          </h2>
        </div>

        {filteredProspects.length === 0 ? (
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
            <AlertTriangle className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No anomalies found</h3>
            <p className="text-gray-500">
              Try adjusting your filters or search terms
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredProspects.map((prospect) => {
              const anomalyFlags = parseAnomalyFlags(prospect.anomaliesDetected)
              return (
                <div key={prospect.id} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-1">{prospect.companyName}</h3>
                      <p className="text-sm text-gray-500">
                        {prospect.city && `${prospect.city} • `}
                        {prospect.businessType}
                        {prospect.leadScore !== undefined && ` • Score: ${prospect.leadScore}`}
                      </p>
                    </div>
                    {prospect.isHotLead && (
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                        Hot Lead
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-4">
                    {/* Anomaly Flags */}
                    <div className="flex flex-wrap gap-2">
                      {anomalyFlags.map((flag) => (
                        <Badge key={flag} className="bg-red-500/20 text-red-400 border-red-500/30 flex items-center gap-1">
                          {getAnomalyIcon(flag)}
                          {getAnomalyLabel(flag)}
                        </Badge>
                      ))}
                    </div>

                    {/* Business Info */}
                    <div className="grid gap-2 text-sm">
                      {prospect.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-300">{prospect.phone}</span>
                        </div>
                      )}
                      {prospect.website && (
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-gray-500" />
                          <a
                            href={prospect.website.startsWith('http') ? prospect.website : `https://${prospect.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:underline flex items-center gap-1"
                          >
                            {prospect.website}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                      {!prospect.website && (
                        <div className="flex items-center gap-2 text-gray-500">
                          <Globe className="h-4 w-4" />
                          <span>No website available</span>
                        </div>
                      )}
                    </div>

                    {/* Review Stats */}
                    {prospect.reviewCount !== undefined && (
                      <div className="flex gap-4 text-sm text-gray-500">
                        <span>{prospect.reviewCount} reviews</span>
                        {prospect.googleRating && (
                          <span className="text-amber-400">⭐ {prospect.googleRating.toFixed(1)}</span>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    {prospect.gbpUrl && (
                      <Button variant="outline" size="sm" asChild className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white">
                        <a href={prospect.gbpUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View on Google Maps
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
