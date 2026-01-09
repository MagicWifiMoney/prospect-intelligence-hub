
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
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
  id: number
  business_name: string
  phone?: string
  website?: string
  gmb_url?: string
  total_reviews?: number
  recent_reviews?: number
  average_rating?: number
  anomaly_flags: string[]
  lead_score?: number
  city?: string
  category?: string
}

export default function AnomaliesPage() {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [filteredProspects, setFilteredProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [anomalyFilter, setAnomalyFilter] = useState('all')

  useEffect(() => {
    fetchAnomalies()
  }, [])

  useEffect(() => {
    filterProspects()
  }, [searchTerm, anomalyFilter, prospects])

  const fetchAnomalies = async () => {
    try {
      const response = await fetch('/api/prospects?anomalies_only=true')
      if (!response.ok) throw new Error('Failed to fetch anomalies')
      const data = await response.json()
      setProspects(data.prospects || [])
    } catch (error) {
      console.error('Error fetching anomalies:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterProspects = () => {
    let filtered = [...prospects]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.city?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Anomaly type filter
    if (anomalyFilter !== 'all') {
      filtered = filtered.filter(p =>
        p.anomaly_flags.includes(anomalyFilter)
      )
    }

    setFilteredProspects(filtered)
  }

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
    no_website: prospects.filter(p => p.anomaly_flags.includes('no_website')).length,
    personal_phone: prospects.filter(p => p.anomaly_flags.includes('personal_phone')).length,
    review_spike: prospects.filter(p => p.anomaly_flags.includes('review_spike')).length,
    review_drop: prospects.filter(p => p.anomaly_flags.includes('review_drop')).length,
    low_rating: prospects.filter(p => p.anomaly_flags.includes('low_rating')).length,
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Anomaly Detection</h1>
        <p className="text-muted-foreground mb-4">
          Identify prospects with unusual patterns or missing information
        </p>
        
        {/* Page Description */}
        <Card className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 border-red-200 dark:border-red-900">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-100 mb-1">What Are Anomalies</h3>
                <p className="text-sm text-red-800 dark:text-red-200">
                  Anomalies are data quality flags automatically detected in your prospect database: missing websites, personal phone numbers (vs business lines), 
                  low review counts (under 5 reviews), declining ratings (recent reviews worse than overall), or stagnant engagement (no new reviews in 6+ months). 
                  These signal businesses that may be struggling, unprofessional, or in need of digital presence improvement.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-100 mb-1">How to Leverage Anomaly Data</h3>
                <ul className="text-sm text-red-800 dark:text-red-200 space-y-1 list-disc list-inside">
                  <li><strong>No Website:</strong> Prime candidates for web design services - "I noticed you don't have a website. Here's what you're missing..."</li>
                  <li><strong>Personal Phone:</strong> Pitch call tracking, business line setup, or professional communication systems</li>
                  <li><strong>Low Review Count:</strong> Opportunity to sell reputation management or review generation services</li>
                  <li><strong>Declining Ratings:</strong> Urgent intervention opportunity - these businesses need help NOW before losing more customers</li>
                  <li><strong>Stagnant Reviews:</strong> Signal of declining customer engagement - sell social media management or local SEO services</li>
                  <li><strong>Multiple Flags:</strong> Prospects with 2+ anomalies are distressed businesses with high urgency and may convert faster</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No Website</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{anomalyCounts.no_website}</div>
            <p className="text-xs text-muted-foreground">Easy wins</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Personal Phone</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{anomalyCounts.personal_phone}</div>
            <p className="text-xs text-muted-foreground">Unprofessional</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Review Spikes</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{anomalyCounts.review_spike}</div>
            <p className="text-xs text-muted-foreground">Growing fast</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Review Drops</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{anomalyCounts.review_drop}</div>
            <p className="text-xs text-muted-foreground">Declining</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Ratings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{anomalyCounts.low_rating}</div>
            <p className="text-xs text-muted-foreground">Need help</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Anomalies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by business name or city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={anomalyFilter} onValueChange={setAnomalyFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Anomalies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Anomalies</SelectItem>
                <SelectItem value="no_website">No Website</SelectItem>
                <SelectItem value="personal_phone">Personal Phone</SelectItem>
                <SelectItem value="review_spike">Review Spike</SelectItem>
                <SelectItem value="review_drop">Review Drop</SelectItem>
                <SelectItem value="low_rating">Low Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {filteredProspects.length} Prospects with Anomalies
          </h2>
        </div>

        {filteredProspects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No anomalies found</h3>
              <p className="text-muted-foreground text-center">
                Try adjusting your filters or search terms
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredProspects.map((prospect) => (
              <Card key={prospect.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{prospect.business_name}</CardTitle>
                      <CardDescription>
                        {prospect.city && `${prospect.city} • `}
                        {prospect.category}
                        {prospect.lead_score !== undefined && ` • Score: ${prospect.lead_score}`}
                      </CardDescription>
                    </div>
                    {prospect.lead_score !== undefined && (
                      <Badge variant={prospect.lead_score >= 70 ? 'default' : 'secondary'}>
                        {prospect.lead_score >= 70 ? 'Hot Lead' : 'Prospect'}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Anomaly Flags */}
                    <div className="flex flex-wrap gap-2">
                      {prospect.anomaly_flags.map((flag) => (
                        <Badge key={flag} variant="destructive" className="flex items-center gap-1">
                          {getAnomalyIcon(flag)}
                          {getAnomalyLabel(flag)}
                        </Badge>
                      ))}
                    </div>

                    {/* Business Info */}
                    <div className="grid gap-2 text-sm">
                      {prospect.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{prospect.phone}</span>
                        </div>
                      )}
                      {prospect.website && (
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <a
                            href={prospect.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            {prospect.website}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                      {!prospect.website && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Globe className="h-4 w-4" />
                          <span>No website available</span>
                        </div>
                      )}
                    </div>

                    {/* Review Stats */}
                    {prospect.total_reviews !== undefined && (
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>{prospect.total_reviews} total reviews</span>
                        <span>{prospect.recent_reviews} recent reviews</span>
                        {prospect.average_rating && (
                          <span>⭐ {prospect.average_rating.toFixed(1)}</span>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    {prospect.gmb_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={prospect.gmb_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View on Google Maps
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
