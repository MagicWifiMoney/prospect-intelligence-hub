
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Star, 
  Phone, 
  Mail, 
  ExternalLink, 
  MapPin,
  TrendingUp,
  Clock,
  Target,
  Lightbulb,
  Eye
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { QuickActionsMenu } from '@/components/prospects/quick-actions-menu'

interface HotLead {
  id: string
  companyName: string
  businessType: string | null
  city: string | null
  phone: string | null
  email: string | null
  website: string | null
  gbpUrl: string | null
  googleRating: number | null
  reviewCount: number | null
  leadScore: number | null
  sentimentScore: number | null
  aiRecommendations: string | null
  lastAnalyzed: Date | null
  contactedAt: Date | null
  isConverted: boolean
}

export function HotLeadsTable() {
  const [hotLeads, setHotLeads] = useState<HotLead[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { toast } = useToast()

  const fetchHotLeads = async (currentPage = 1) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/prospects/hot-leads?page=${currentPage}&limit=20`)
      
      if (response.ok) {
        const data = await response.json()
        setHotLeads(data.prospects || [])
        setTotalPages(data.totalPages || 1)
        setPage(currentPage)
      }
    } catch (error) {
      console.error('Error fetching hot leads:', error)
      toast({
        title: "Error",
        description: "Failed to load hot leads",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHotLeads()
  }, [])

  const markAsContacted = async (leadId: string) => {
    try {
      // In a real app, this would call an API to mark as contacted
      toast({
        title: "Marked as Contacted",
        description: "This lead has been marked as contacted",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update contact status",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {hotLeads.length} hot leads
          </p>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchHotLeads(Math.max(1, page - 1))}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <span className="px-3 py-1 text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchHotLeads(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Performance</TableHead>
              <TableHead>AI Score</TableHead>
              <TableHead>Recommendations</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {hotLeads.map((lead, index) => (
              <motion.tr
                key={lead.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group hover:bg-muted/50"
              >
                <TableCell>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="font-semibold truncate">{lead.companyName}</p>
                        <Star className="h-4 w-4 text-orange-500 fill-current" />
                      </div>
                      <div className="space-y-1 mt-1">
                        {lead.businessType && (
                          <Badge variant="outline" className="text-xs">
                            {lead.businessType}
                          </Badge>
                        )}
                        {lead.city && (
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{lead.city}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      {lead.phone && (
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Phone className="h-4 w-4" />
                        </Button>
                      )}
                      {lead.email && (
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Mail className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {lead.website && (
                      <a
                        href={lead.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center space-x-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>Website</span>
                      </a>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <div className="space-y-1">
                    {lead.googleRating ? (
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium">{lead.googleRating}</span>
                        <span className="text-xs text-muted-foreground">
                          ({lead.reviewCount || 0})
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">No rating</span>
                    )}
                    {lead.sentimentScore && (
                      <div className="text-xs text-muted-foreground">
                        Sentiment: {Math.round(lead.sentimentScore)}%
                      </div>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  {lead.leadScore ? (
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="font-bold text-green-600">
                          {Math.round(lead.leadScore)}%
                        </span>
                      </div>
                      <div className="w-16 h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-400 to-red-500 transition-all"
                          style={{ width: `${lead.leadScore}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Not scored</span>
                  )}
                  {lead.lastAnalyzed && (
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {formatDistanceToNow(new Date(lead.lastAnalyzed), { addSuffix: true })}
                      </span>
                    </div>
                  )}
                </TableCell>

                <TableCell>
                  {lead.aiRecommendations ? (
                    <div className="max-w-xs">
                      <div className="flex items-start space-x-1 mb-1">
                        <Lightbulb className="h-3 w-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <span className="text-xs font-medium">AI Suggestions:</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-3">
                        {lead.aiRecommendations}
                      </p>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">No recommendations</span>
                  )}
                </TableCell>

                <TableCell>
                  <div className="flex flex-col space-y-1">
                    {lead.isConverted && (
                      <Badge variant="default" className="text-xs">
                        <Target className="mr-1 h-3 w-3" />
                        Converted
                      </Badge>
                    )}
                    {lead.contactedAt && !lead.isConverted && (
                      <Badge variant="secondary" className="text-xs">
                        Contacted {formatDistanceToNow(new Date(lead.contactedAt), { addSuffix: true })}
                      </Badge>
                    )}
                    {!lead.contactedAt && !lead.isConverted && (
                      <Badge variant="destructive" className="text-xs animate-pulse">
                        Ready for Outreach
                      </Badge>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Link href={`/dashboard/prospects/${lead.id}`}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <QuickActionsMenu 
                      prospect={lead} 
                      onUpdate={() => fetchHotLeads(page)}
                    />
                  </div>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>

      {hotLeads.length === 0 && (
        <div className="text-center py-12">
          <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No hot leads found</h3>
          <p className="text-muted-foreground mb-4">
            Hot leads will appear here after AI analysis identifies high-potential prospects
          </p>
          <Link href="/dashboard/prospects">
            <Button>View All Prospects</Button>
          </Link>
        </div>
      )}
    </div>
  )
}
