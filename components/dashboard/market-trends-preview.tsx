
'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, ArrowRight, Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { motion } from 'framer-motion'

interface MarketTrend {
  id: string
  category: string
  title: string
  content: string
  trend: string | null
  relevance: number | null
  extractedAt: Date
}

interface MarketTrendsPreviewProps {
  trends: MarketTrend[]
}

export function MarketTrendsPreview({ trends }: MarketTrendsPreviewProps) {
  const getTrendColor = (trend: string | null) => {
    switch (trend?.toLowerCase()) {
      case 'growing':
      case 'accelerating':
        return 'bg-green-500'
      case 'declining':
        return 'bg-red-500'
      case 'emerging':
        return 'bg-blue-500'
      case 'stable':
        return 'bg-gray-500'
      default:
        return 'bg-purple-500'
    }
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span>Market Trends</span>
            </CardTitle>
            <CardDescription>Latest insights and market developments</CardDescription>
          </div>
          <Link href="/dashboard/trends">
            <Button variant="outline" size="sm">
              View All Trends
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {trends.length === 0 ? (
            <div className="col-span-3 text-center py-8 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No market trends available.</p>
              <p className="text-sm">Trends will appear here after data collection.</p>
            </div>
          ) : (
            trends.map((trend, index) => (
              <motion.div
                key={trend.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="outline" className="text-xs">
                    {trend.category}
                  </Badge>
                  {trend.trend && (
                    <div className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${getTrendColor(trend.trend)}`} />
                      <span className="text-xs text-muted-foreground capitalize">
                        {trend.trend}
                      </span>
                    </div>
                  )}
                </div>
                
                <h4 className="font-semibold text-sm mb-2 line-clamp-2">
                  {trend.title}
                </h4>
                
                <p className="text-xs text-muted-foreground mb-3 line-clamp-3">
                  {trend.content}
                </p>
                
                <div className="flex items-center justify-between">
                  {trend.relevance && (
                    <Badge variant="secondary" className="text-xs">
                      {Math.round(trend.relevance * 100)}% relevant
                    </Badge>
                  )}
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {formatDistanceToNow(new Date(trend.extractedAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
