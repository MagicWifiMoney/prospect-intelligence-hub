
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Star, Target, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface OverviewStatsProps {
  totalProspects: number
  hotLeads: number
  newBusinesses: number
  averageScore: number
}

function CountUp({ end, duration = 2000 }: { end: number; duration?: number }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime: number
    let animationFrame: number

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      setCount(Math.floor(progress * end))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [end, duration])

  return <span>{count}</span>
}

export function OverviewStats({ totalProspects, hotLeads, newBusinesses, averageScore }: OverviewStatsProps) {
  const stats = [
    {
      title: 'Total Prospects',
      value: totalProspects,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Hot Leads',
      value: hotLeads,
      icon: Star,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'New Businesses',
      value: newBusinesses,
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Average Score',
      value: averageScore,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      isDecimal: true,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stat.isDecimal ? (
                  <CountUp end={Math.round(stat.value * 10) / 10} />
                ) : (
                  <CountUp end={stat.value} />
                )}
                {stat.isDecimal && '%'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.title === 'New Businesses' && 'Last 7 days'}
                {stat.title === 'Hot Leads' && 'Ready for outreach'}
                {stat.title === 'Total Prospects' && 'In your database'}
                {stat.title === 'Average Score' && 'Lead quality score'}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
