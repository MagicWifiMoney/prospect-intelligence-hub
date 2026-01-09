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
  Gem,
  Phone,
  Mail,
  ExternalLink,
  MapPin,
  Globe,
  Eye,
  AlertCircle,
  Star,
  TrendingUp,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'
import { QuickActionsMenu } from '@/components/prospects/quick-actions-menu'

interface GoldmineProspect {
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
  opportunityScore: number | null
  highTicketScore: number | null
  opportunityTags: string[]
  scoringFactors: any
  contactedAt: Date | null
  isConverted: boolean
  facebook: string | null
  instagram: string | null
  linkedin: string | null
}

export function GoldminesTable() {
  const [prospects, setProspects] = useState<GoldmineProspect[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const { toast } = useToast()

  const fetchGoldmines = async (currentPage = 1) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/prospects/goldmines?page=${currentPage}&limit=20`)

      if (response.ok) {
        const data = await response.json()
        setProspects(data.prospects || [])
        setTotalPages(data.totalPages || 1)
        setTotal(data.total || 0)
        setPage(currentPage)
      }
    } catch (error) {
      console.error('Error fetching goldmines:', error)
      toast({
        title: 'Error',
        description: 'Failed to load goldmine prospects',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGoldmines()
  }, [])

  const getOpportunityBadges = (prospect: GoldmineProspect) => {
    const badges = []

    if (!prospect.website) {
      badges.push({ label: 'Needs Website', color: 'bg-red-100 text-red-800' })
    }

    if (!prospect.facebook && !prospect.instagram) {
      badges.push({ label: 'No Social', color: 'bg-orange-100 text-orange-800' })
    }

    if (prospect.opportunityTags?.includes('quick_win')) {
      badges.push({ label: 'Quick Win', color: 'bg-green-100 text-green-800' })
    }

    if (prospect.opportunityTags?.includes('high_ticket')) {
      badges.push({ label: 'High Ticket', color: 'bg-purple-100 text-purple-800' })
    }

    return badges
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
            Showing {prospects.length} of {total} goldmine prospects
          </p>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchGoldmines(Math.max(1, page - 1))}
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
              onClick={() => fetchGoldmines(Math.min(totalPages, page + 1))}
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
              <TableHead>Opportunity</TableHead>
              <TableHead>Performance</TableHead>
              <TableHead>Gaps</TableHead>
              <TableHead>Opp Score</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prospects.map((prospect, index) => (
              <motion.tr
                key={prospect.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="group hover:bg-muted/50"
              >
                <TableCell>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="font-semibold truncate">{prospect.companyName}</p>
                        <Gem className="h-4 w-4 text-amber-500" />
                      </div>
                      <div className="space-y-1 mt-1">
                        {prospect.businessType && (
                          <Badge variant="outline" className="text-xs">
                            {prospect.businessType}
                          </Badge>
                        )}
                        {prospect.city && (
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{prospect.city}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {getOpportunityBadges(prospect).map((badge, i) => (
                      <span
                        key={i}
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badge.color}`}
                      >
                        {badge.label}
                      </span>
                    ))}
                  </div>
                </TableCell>

                <TableCell>
                  <div className="space-y-1">
                    {prospect.googleRating ? (
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium">{prospect.googleRating}</span>
                        <span className="text-xs text-muted-foreground">
                          ({prospect.reviewCount || 0})
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">No rating</span>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center space-x-2">
                      <Globe className={`h-3 w-3 ${prospect.website ? 'text-green-500' : 'text-red-500'}`} />
                      <span className={prospect.website ? 'text-green-600' : 'text-red-600 font-medium'}>
                        {prospect.website ? 'Has website' : 'NO WEBSITE'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {prospect.facebook || prospect.instagram ? (
                        <span className="text-green-600">Has social</span>
                      ) : (
                        <span className="text-orange-600">No social</span>
                      )}
                    </div>
                    {prospect.phone && (
                      <div className="flex items-center space-x-1">
                        <Phone className="h-3 w-3 text-green-500" />
                        <span className="text-muted-foreground truncate max-w-[100px]">
                          {prospect.phone}
                        </span>
                      </div>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  {prospect.opportunityScore ? (
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="h-4 w-4 text-amber-500" />
                        <span className="font-bold text-amber-600">
                          {prospect.opportunityScore}
                        </span>
                      </div>
                      <div className="w-16 h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all"
                          style={{ width: `${prospect.opportunityScore}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Not scored</span>
                  )}
                </TableCell>

                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Link href={`/dashboard/prospects/${prospect.id}`}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <QuickActionsMenu
                      prospect={prospect}
                      onUpdate={() => fetchGoldmines(page)}
                    />
                  </div>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>

      {prospects.length === 0 && (
        <div className="text-center py-12">
          <Gem className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No goldmines found</h3>
          <p className="text-muted-foreground mb-4">
            Run the enhanced scoring to identify goldmine opportunities
          </p>
        </div>
      )}
    </div>
  )
}
