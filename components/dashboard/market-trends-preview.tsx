
'use client'

import Link from 'next/link'
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
        return 'bg-green-400'
      case 'declining':
        return 'bg-red-400'
      case 'emerging':
        return 'bg-cyan-400'
      case 'stable':
        return 'bg-gray-400'
      default:
        return 'bg-purple-400'
    }
  }

  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <TrendingUp className="h-5 w-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white font-display">Market Trends</h3>
          </div>
          <p className="text-sm text-gray-500">Latest insights and market developments</p>
        </div>
        <Link href="/dashboard/trends">
          <Button
            variant="outline"
            size="sm"
            className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white"
          >
            View All Trends
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {trends.length === 0 ? (
          <div className="col-span-3 text-center py-8">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">No market trends available.</p>
            <p className="text-sm text-gray-500">Trends will appear here after data collection.</p>
          </div>
        ) : (
          trends.map((trend, index) => (
            <motion.div
              key={trend.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-200 border border-transparent hover:border-white/10 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <Badge className="text-xs bg-white/10 text-gray-300 border-white/20">
                  {trend.category}
                </Badge>
                {trend.trend && (
                  <div className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full ${getTrendColor(trend.trend)}`} />
                    <span className="text-xs text-gray-400 capitalize">
                      {trend.trend}
                    </span>
                  </div>
                )}
              </div>

              <h4 className="font-semibold text-sm text-white mb-2 line-clamp-2">
                {trend.title}
              </h4>

              <p className="text-xs text-gray-500 mb-3 line-clamp-3">
                {trend.content}
              </p>

              <div className="flex items-center justify-between">
                {trend.relevance && (
                  <Badge className="text-xs bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                    {Math.round(trend.relevance * 100)}% relevant
                  </Badge>
                )}
                <div className="flex items-center space-x-1 text-xs text-gray-500">
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
    </div>
  )
}
