
'use client'

import { Badge } from '@/components/ui/badge'
import { Activity, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { motion } from 'framer-motion'

interface RecentProspect {
  id: string
  companyName: string
  businessType: string | null
  city: string | null
  leadScore: number | null
  isHotLead: boolean
  updatedAt: Date
}

interface RecentActivityProps {
  recentProspects: RecentProspect[]
}

export function RecentActivity({ recentProspects }: RecentActivityProps) {
  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
      <div className="mb-4">
        <div className="flex items-center space-x-2 mb-1">
          <Activity className="h-5 w-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white font-display">Recent Activity</h3>
        </div>
        <p className="text-sm text-gray-500">
          Recently updated prospects in your database
        </p>
      </div>
      <div className="space-y-3">
        {recentProspects.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">No recent activity found.</p>
          </div>
        ) : (
          recentProspects.map((prospect, index) => (
            <motion.div
              key={prospect.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-200"
            >
              <div className="w-2 h-2 bg-cyan-400 rounded-full flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <p className="text-sm font-medium text-white truncate">
                    {prospect.companyName}
                  </p>
                  {prospect.isHotLead && (
                    <Badge className="text-xs bg-amber-500/20 text-amber-400 border-amber-500/30">
                      Hot Lead
                    </Badge>
                  )}
                  {prospect.leadScore && (
                    <Badge className="text-xs bg-white/10 text-gray-300 border-white/20">
                      {Math.round(prospect.leadScore)}%
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  {prospect.businessType && (
                    <span className="capitalize">{prospect.businessType}</span>
                  )}
                  {prospect.city && (
                    <>
                      <span>•</span>
                      <span>{prospect.city}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                <span>
                  {formatDistanceToNow(new Date(prospect.updatedAt), { addSuffix: true })}
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
