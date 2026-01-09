
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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

  useEffect(() => {
    fetchTrends()
  }, [])

  const fetchTrends = async () => {
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
  }

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
        return 'destructive'
      case 'medium':
        return 'default'
      case 'low':
        return 'secondary'
      default:
        return 'default'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Market Trends</h1>
            <p className="text-muted-foreground mt-1">
              Stay updated with the latest trends in your market
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
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
            <h1 className="text-3xl font-bold tracking-tight">Market Trends</h1>
            <p className="text-muted-foreground mt-1">
              AI-powered insights and market intelligence
            </p>
          </div>
          <Button 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <TrendingUp className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Trends'}
          </Button>
        </div>
        
        {/* Page Description */}
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-900">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">What Are Market Trends</h3>
                <p className="text-sm text-purple-800 dark:text-purple-200">
                  AI-generated insights about service industry trends, digital marketing shifts, customer behavior changes, and technology adoption patterns. 
                  Trends are generated using Gemini AI analyzing current market data, industry reports, and business intelligence specific to contractors, home services, and local businesses.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">How to Leverage Market Trends</h3>
                <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1 list-disc list-inside">
                  <li><strong>Click "Refresh Trends":</strong> Generate 5 new AI-powered insights about current market conditions relevant to your prospects</li>
                  <li><strong>Focus on High Impact:</strong> Prioritize trends marked as "HIGH" impact - these represent significant opportunities or threats</li>
                  <li><strong>Upward Trends (📈):</strong> Growing opportunities where early adoption gives competitive advantage - mention these in outreach</li>
                  <li><strong>Adjust Your Pitch:</strong> Use trending topics to make your outreach more timely and relevant (e.g., "With local search up 47%...")</li>
                  <li><strong>Stay Current:</strong> Refresh trends weekly to keep your market knowledge up-to-date and maintain conversation relevance</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trends</CardTitle>
            <Newspaper className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trends.length}</div>
            <p className="text-xs text-muted-foreground">
              Across all categories
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Impact</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trends.filter(t => t.impact === 'high').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upward Trends</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trends.filter(t => t.trend_direction === 'up').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Growing opportunities
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trends List */}
      {trends.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Newspaper className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No trends available</h3>
            <p className="text-muted-foreground text-center mb-4">
              Click "Refresh Trends" to fetch the latest market insights
            </p>
            <Button onClick={handleRefresh} disabled={refreshing}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Fetch Trends
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {trends.map((trend) => (
            <Card key={trend.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={getImpactColor(trend.impact)}>
                        {trend.impact.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">
                        {getCategoryLabel(trend.category)}
                      </Badge>
                      {trend.trend_direction === 'up' && (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      )}
                      {trend.trend_direction === 'down' && (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <CardTitle className="text-xl">{trend.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {new Date(trend.date).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  {trend.summary}
                </p>
                {trend.source && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={trend.source} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Source
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
