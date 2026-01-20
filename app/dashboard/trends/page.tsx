'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, ExternalLink, Newspaper, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Trend {
  id: string
  title: string
  category: 'service_business' | 'general_market' | 'industry_news'
  summary: string
  impact: 'high' | 'medium' | 'low'
  trend_direction: 'up' | 'down' | 'stable'
  source?: string
  date: string
}

export default function TrendsPage() {
  const [trends, setTrends] = useState<Trend[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  const fetchTrends = useCallback(async () => {
    try {
      const response = await fetch('/api/trends')
      if (!response.ok) throw new Error('Failed to fetch trends')
      const data = await response.json()
      setTrends(data.trends || [])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load market trends. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchTrends()
  }, [fetchTrends])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const response = await fetch('/api/trends', {
        method: 'POST',
      })

      if (!response.ok) throw new Error('Failed to refresh trends')

      const data = await response.json()
      setTrends(data.trends || [])

      toast({
        title: "Trends Updated",
        description: "Market trends have been refreshed with the latest data.",
      })
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Could not refresh trends. Please try again.",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'service_business':
        return 'Service Business'
      case 'general_market':
        return 'General Market'
      case 'industry_news':
        return 'Industry News'
      default:
        return category
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'medium':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'low':
        return 'bg-white/10 text-gray-300 border-white/20'
      default:
        return 'bg-white/10 text-gray-300 border-white/20'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white font-display">Market Trends</h1>
            <p className="text-gray-400 mt-1">
              Stay updated with the latest trends in your market
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="h-6 w-3/4 bg-white/10 rounded animate-pulse mb-4" />
              <div className="h-20 w-full bg-white/10 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-2 text-white font-display">
              <TrendingUp className="h-8 w-8 text-green-400" />
              <span>Market Trends</span>
            </h1>
            <p className="text-gray-400 mt-1">
              AI-powered insights and market intelligence
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-cyan-500 hover:bg-cyan-600 text-white"
          >
            <TrendingUp className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Trends'}
          </Button>
        </div>

        {/* Page Description */}
        <div className="backdrop-blur-xl bg-gradient-to-r from-purple-500/10 to-pink-500/5 border border-purple-500/20 rounded-2xl p-6">
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-purple-400 mb-1">What Are Market Trends</h3>
              <p className="text-sm text-gray-300">
                AI-generated insights about service industry trends, digital marketing shifts, customer behavior changes, and technology adoption patterns.
                Trends are generated using Gemini AI analyzing current market data, industry reports, and business intelligence specific to contractors, home services, and local businesses.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-purple-400 mb-1">How to Leverage Market Trends</h3>
              <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                <li><strong className="text-white">Click &ldquo;Refresh Trends&rdquo;:</strong> Generate 5 new AI-powered insights about current market conditions relevant to your prospects</li>
                <li><strong className="text-white">Focus on High Impact:</strong> Prioritize trends marked as &ldquo;HIGH&rdquo; impact - these represent significant opportunities or threats</li>
                <li><strong className="text-white">Upward Trends:</strong> Growing opportunities where early adoption gives competitive advantage - mention these in outreach</li>
                <li><strong className="text-white">Adjust Your Pitch:</strong> Use trending topics to make your outreach more timely and relevant</li>
                <li><strong className="text-white">Stay Current:</strong> Refresh trends weekly to keep your market knowledge up-to-date</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Total Trends</h3>
            <Newspaper className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">{trends.length}</div>
          <p className="text-xs text-gray-500">
            Across all categories
          </p>
        </div>
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">High Impact</h3>
            <AlertCircle className="h-4 w-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400">
            {trends.filter(t => t.impact === 'high').length}
          </div>
          <p className="text-xs text-gray-500">
            Require immediate attention
          </p>
        </div>
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-400">Upward Trends</h3>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-green-400">
            {trends.filter(t => t.trend_direction === 'up').length}
          </div>
          <p className="text-xs text-gray-500">
            Growing opportunities
          </p>
        </div>
      </div>

      {/* Trends List */}
      {trends.length === 0 ? (
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <Newspaper className="h-12 w-12 text-gray-600 mb-4 mx-auto" />
          <h3 className="text-lg font-semibold text-white mb-2">No trends available</h3>
          <p className="text-gray-500 mb-4">
            Click &ldquo;Refresh Trends&rdquo; to fetch the latest market insights
          </p>
          <Button onClick={handleRefresh} disabled={refreshing} className="bg-cyan-500 hover:bg-cyan-600">
            <TrendingUp className="h-4 w-4 mr-2" />
            Fetch Trends
          </Button>
        </div>
      ) : (
        <div className="grid gap-6">
          {trends.map((trend) => (
            <div key={trend.id} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={`${getImpactColor(trend.impact)} border`}>
                      {trend.impact.toUpperCase()}
                    </Badge>
                    <Badge className="bg-white/10 text-gray-300 border-white/20">
                      {getCategoryLabel(trend.category)}
                    </Badge>
                    {trend.trend_direction === 'up' && (
                      <TrendingUp className="h-4 w-4 text-green-400" />
                    )}
                    {trend.trend_direction === 'down' && (
                      <TrendingDown className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-1">{trend.title}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(trend.date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <p className="text-gray-400 leading-relaxed mb-4">
                {trend.summary}
              </p>
              {trend.source && (
                <Button variant="outline" size="sm" asChild className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white">
                  <a href={trend.source} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Source
                  </a>
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
