
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="h-5 w-5 text-blue-500" />
          <span>Recent Activity</span>
        </CardTitle>
        <CardDescription>
          Shows the 5 most recently updated prospects in your database. This includes new prospects added, lead scores recalculated, or any data refreshes. 
          Use this to quickly spot newly discovered high-value prospects or track which businesses have had recent changes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentProspects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent activity found.</p>
            </div>
          ) : (
            recentProspects.map((prospect, index) => (
              <motion.div
                key={prospect.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg"
              >
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="text-sm font-medium truncate">
                      {prospect.companyName}
                    </p>
                    {prospect.isHotLead && (
                      <Badge variant="secondary" className="text-xs">
                        Hot Lead
                      </Badge>
                    )}
                    {prospect.leadScore && (
                      <Badge variant="outline" className="text-xs">
                        {Math.round(prospect.leadScore)}%
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
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
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    {formatDistanceToNow(new Date(prospect.updatedAt), { addSuffix: true })}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
