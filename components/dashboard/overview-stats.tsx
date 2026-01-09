
'use client'

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

  return <span>{count.toLocaleString()}</span>
}

export function OverviewStats({ totalProspects, hotLeads, newBusinesses, averageScore }: OverviewStatsProps) {
  const stats = [
    {
      title: 'Total Prospects',
      value: totalProspects,
      icon: Users,
      iconColor: 'text-cyan-400',
      glowColor: 'shadow-cyan-500/20',
      bgGradient: 'from-cyan-500/10 to-cyan-500/5',
      description: 'In your database',
    },
    {
      title: 'Hot Leads',
      value: hotLeads,
      icon: Star,
      iconColor: 'text-amber-400',
      glowColor: 'shadow-amber-500/20',
      bgGradient: 'from-amber-500/10 to-amber-500/5',
      description: 'Ready for outreach',
    },
    {
      title: 'New Businesses',
      value: newBusinesses,
      icon: Target,
      iconColor: 'text-green-400',
      glowColor: 'shadow-green-500/20',
      bgGradient: 'from-green-500/10 to-green-500/5',
      description: 'Last 7 days',
    },
    {
      title: 'Average Score',
      value: averageScore,
      icon: TrendingUp,
      iconColor: 'text-purple-400',
      glowColor: 'shadow-purple-500/20',
      bgGradient: 'from-purple-500/10 to-purple-500/5',
      isDecimal: true,
      description: 'Lead quality score',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <div className={`backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all duration-300 shadow-lg ${stat.glowColor}`}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-400">
                {stat.title}
              </span>
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.bgGradient}`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
            </div>
            <div className="text-3xl font-bold text-white font-display mb-1">
              {stat.isDecimal ? (
                <>
                  <CountUp end={Math.round(stat.value * 10) / 10} />
                  <span className="text-2xl">%</span>
                </>
              ) : (
                <CountUp end={stat.value} />
              )}
            </div>
            <p className="text-xs text-gray-500">
              {stat.description}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
