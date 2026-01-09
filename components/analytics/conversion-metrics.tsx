
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Target, Users, Clock, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'

export function ConversionMetrics() {
  const funnelStages = [
    { stage: 'Initial Contact', count: 598, percentage: 100, color: 'bg-blue-500' },
    { stage: 'Qualified Prospects', count: 234, percentage: 39, color: 'bg-indigo-500' },
    { stage: 'Hot Leads', count: 89, percentage: 15, color: 'bg-orange-500' },
    { stage: 'Proposals Sent', count: 45, percentage: 8, color: 'bg-yellow-500' },
    { stage: 'Conversions', count: 23, percentage: 4, color: 'bg-green-500' },
  ]

  const performanceMetrics = [
    {
      title: 'Average Time to Convert',
      value: '14.2 days',
      change: '-2.3 days',
      trend: 'improved',
      icon: Clock,
    },
    {
      title: 'Cost per Acquisition',
      value: '$127',
      change: '-$18',
      trend: 'improved',
      icon: Target,
    },
    {
      title: 'Lead Quality Score',
      value: '8.4/10',
      change: '+0.6',
      trend: 'improved',
      icon: TrendingUp,
    },
    {
      title: 'Active Pipeline',
      value: '156',
      change: '+34',
      trend: 'improved',
      icon: Users,
    },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-green-500" />
            <span>Conversion Funnel</span>
          </CardTitle>
          <CardDescription>
            Prospect journey from initial contact to conversion
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {funnelStages.map((stage, index) => (
              <motion.div
                key={stage.stage}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{stage.stage}</span>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {stage.count}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {stage.percentage}%
                    </span>
                  </div>
                </div>
                <Progress value={stage.percentage} className="h-2" />
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            <span>Performance Metrics</span>
          </CardTitle>
          <CardDescription>
            Key performance indicators and trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {performanceMetrics.map((metric, index) => (
              <motion.div
                key={metric.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <metric.icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{metric.title}</p>
                    <p className="text-lg font-bold">{metric.value}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge 
                    variant="secondary"
                    className="text-xs text-green-600 bg-green-50"
                  >
                    {metric.change}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    vs. last month
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
