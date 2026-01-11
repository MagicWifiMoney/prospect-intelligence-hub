
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Eye,
  Phone,
  Mail,
  ExternalLink,
  MoreHorizontal,
  Star,
  MapPin,
  AlertTriangle,
  TrendingUp,
  Users
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'
import { QuickActionsMenu } from './quick-actions-menu'
import { BulkActionToolbar } from './bulk-action-toolbar'

interface Prospect {
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
  isHotLead: boolean
  anomaliesDetected: string | null
  contactedAt: Date | null
  isConverted: boolean
}

export function ProspectsTable() {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const { toast } = useToast()

  const fetchProspects = async (currentPage = 1) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/prospects?page=${currentPage}&limit=20`)

      if (response.ok) {
        const data = await response.json()
        setProspects(data.prospects || [])
        setTotalPages(data.totalPages || 1)
        setTotal(data.total || 0)
        setPage(currentPage)
        // Clear selection when page changes
        setSelectedIds([])
      }
    } catch (error) {
      console.error('Error fetching prospects:', error)
      toast({
        title: "Error",
        description: "Failed to load prospects",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProspects()
  }, [])

  const handleAnalyzeProspect = async (prospectId: string) => {
    try {
      const response = await fetch(`/api/prospects/${prospectId}/analyze`, {
        method: 'POST',
      })

      if (response.ok) {
        toast({
          title: "Analysis Started",
          description: "AI analysis has been triggered for this prospect",
        })
        // Refresh the table after a short delay
        setTimeout(() => fetchProspects(page), 2000)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start analysis",
        variant: "destructive",
      })
    }
  }

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(prospects.map(p => p.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (prospectId: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, prospectId])
    } else {
      setSelectedIds(prev => prev.filter(id => id !== prospectId))
    }
  }

  const isAllSelected = prospects.length > 0 && selectedIds.length === prospects.length
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < prospects.length

  if (loading) {
    return (
      <div className="p-8">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-muted rounded animate-pulse" />
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
            Showing {prospects.length} of {total} prospects
            {selectedIds.length > 0 && (
              <span className="ml-2 text-cyan-400">
                ({selectedIds.length} selected)
              </span>
            )}
          </p>
          <div className="flex space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fetchProspects(Math.max(1, page - 1))}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <span className="px-3 py-1 text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fetchProspects(Math.min(totalPages, page + 1))}
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
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                  className="border-gray-600 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                />
              </TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Type & Location</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prospects.map((prospect, index) => (
              <motion.tr
                key={prospect.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`group hover:bg-muted/50 ${selectedIds.includes(prospect.id) ? 'bg-cyan-500/10' : ''
                  }`}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(prospect.id)}
                    onCheckedChange={(checked) => handleSelectOne(prospect.id, checked as boolean)}
                    aria-label={`Select ${prospect.companyName}`}
                    className="border-gray-600 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-start space-x-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="font-semibold truncate">{prospect.companyName}</p>
                        {prospect.isHotLead && (
                          <Star className="h-4 w-4 text-orange-500 fill-current" />
                        )}
                        {prospect.anomaliesDetected && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      {prospect.website && (
                        <a
                          href={prospect.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-700 hover:text-blue-800 hover:underline flex items-center space-x-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>Website</span>
                        </a>
                      )}
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="space-y-1">
                    {prospect.businessType && (
                      <Badge variant="secondary" className="text-xs">
                        {prospect.businessType}
                      </Badge>
                    )}
                    {prospect.city && (
                      <div className="flex items-center space-x-1 text-xs text-gray-600">
                        <MapPin className="h-3 w-3" />
                        <span>{prospect.city}</span>
                      </div>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex space-x-2">
                    {prospect.phone && (
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Phone className="h-4 w-4" />
                      </Button>
                    )}
                    {prospect.email && (
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Mail className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  {prospect.googleRating ? (
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium">{prospect.googleRating}</span>
                      <span className="text-xs text-gray-600">
                        ({prospect.reviewCount || 0})
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-600">No rating</span>
                  )}
                </TableCell>

                <TableCell>
                  {prospect.leadScore ? (
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="font-medium">{Math.round(prospect.leadScore)}%</span>
                      </div>
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all"
                          style={{ width: `${prospect.leadScore}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleAnalyzeProspect(prospect.id)}
                      className="text-xs"
                    >
                      Analyze
                    </Button>
                  )}
                </TableCell>

                <TableCell>
                  <div className="flex flex-col space-y-1">
                    {prospect.isConverted && (
                      <Badge variant="default" className="text-xs">
                        Converted
                      </Badge>
                    )}
                    {prospect.contactedAt && !prospect.isConverted && (
                      <Badge variant="secondary" className="text-xs">
                        Contacted
                      </Badge>
                    )}
                    {!prospect.contactedAt && !prospect.isConverted && (
                      <Badge variant="secondary" className="text-xs">
                        New
                      </Badge>
                    )}
                  </div>
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
                      onUpdate={() => fetchProspects(page)}
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
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No prospects found</h3>
          <p className="text-muted-foreground mb-4">
            Import prospects or add them manually to get started
          </p>
          <Link href="/dashboard/add-prospects">
            <Button>Add Prospects</Button>
          </Link>
        </div>
      )}

      {/* Bulk Action Toolbar */}
      <BulkActionToolbar
        selectedIds={selectedIds}
        onClearSelection={() => setSelectedIds([])}
        onActionComplete={() => fetchProspects(page)}
      />
    </div>
  )
}

