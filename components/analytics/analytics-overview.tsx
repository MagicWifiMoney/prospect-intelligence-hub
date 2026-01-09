
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Users, Star, Target, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'

export function AnalyticsOverview() {
  const metrics = [
    {
      title: 'Total Prospects',
      value: '598',
      change: '+12%',
      trend: 'up',
      description: 'vs. last month',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Hot Leads',
      value: '45',
      change: '+23%',
      trend: 'up',
      description: 'vs. last month',
      icon: Star,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Conversion Rate',
      value: '8.2%',
      change: '+2.1%',
      trend: 'up',
      description: 'vs. last month',
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Avg Lead Score',
      value: '73.5',
      change: '-1.2%',
      trend: 'down',
      description: 'vs. last month',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Response Rate',
      value: '34.7%',
      change: '+5.8%',
      trend: 'up',
      description: 'vs. last month',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'Anomalies Detected',
      value: '12',
      change: '-8%',
      trend: 'down',
      description: 'vs. last month',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                <metric.icon className={`h-4 w-4 ${metric.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center space-x-2 text-xs">
                <div className={`flex items-center space-x-1 ${
                  metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metric.trend === 'up' ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span className="font-medium">{metric.change}</span>
                </div>
                <span className="text-muted-foreground">{metric.description}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
