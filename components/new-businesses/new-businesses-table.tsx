
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
  Target, 
  MapPin,
  Star,
  Clock,
  Building2,
  Plus,
  TrendingUp
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'

interface NewBusiness {
  id: string
  companyName: string
  businessType: string | null
  address: string | null
  city: string | null
  googleRating: number | null
  reviewCount: number | null
  firstSeenAt: Date
  isNewListing: boolean
  isNewReviews: boolean
  detectedAt: Date
}

export function NewBusinessesTable() {
  const [newBusinesses, setNewBusinesses] = useState<NewBusiness[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Simulate loading new businesses data
    // In a real app, this would fetch from an API
    setTimeout(() => {
      const mockData: NewBusiness[] = [
        {
          id: '1',
          companyName: 'Elite Home Renovations',
          businessType: 'Contractor',
          address: '1234 Main St, Minneapolis, MN 55401',
          city: 'Minneapolis',
          googleRating: null,
          reviewCount: 0,
          firstSeenAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          isNewListing: true,
          isNewReviews: false,
          detectedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          id: '2',
          companyName: 'Modern Plumbing Solutions',
          businessType: 'Plumber',
          address: '5678 Oak Ave, St. Paul, MN 55102',
          city: 'St. Paul',
          googleRating: 4.8,
          reviewCount: 3,
          firstSeenAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          isNewListing: false,
          isNewReviews: true,
          detectedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
        {
          id: '3',
          companyName: 'Fresh Paint Professionals',
          businessType: 'Painter',
          address: '9012 Pine Rd, Plymouth, MN 55447',
          city: 'Plymouth',
          googleRating: 5.0,
          reviewCount: 1,
          firstSeenAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          isNewListing: true,
          isNewReviews: true,
          detectedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        }
      ]
      setNewBusinesses(mockData)
      setLoading(false)
    }, 1000)
  }, [])

  const addToProspects = async (businessId: string, businessName: string) => {
    try {
      // Simulate adding to prospects database
      toast({
        title: "Added to Prospects",
        description: `${businessName} has been added to your prospects database`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add business to prospects",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
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
        <p className="text-sm text-muted-foreground">
          Showing {newBusinesses.length} new businesses detected in the last 7 days
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Rating & Reviews</TableHead>
              <TableHead>Detection</TableHead>
              <TableHead>First Seen</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {newBusinesses.map((business, index) => (
              <motion.tr
                key={business.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group hover:bg-muted/50"
              >
                <TableCell>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{business.companyName}</p>
                      {business.businessType && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {business.businessType}
                        </Badge>
                      )}
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="space-y-1">
                    {business.city && (
                      <div className="flex items-center space-x-1 text-sm">
                        <MapPin className="h-3 w-3" />
                        <span>{business.city}</span>
                      </div>
                    )}
                    {business.address && (
                      <p className="text-xs text-muted-foreground truncate max-w-48">
                        {business.address}
                      </p>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  {business.googleRating && business.reviewCount ? (
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium">{business.googleRating}</span>
                      <span className="text-xs text-muted-foreground">
                        ({business.reviewCount})
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">No reviews yet</span>
                  )}
                </TableCell>

                <TableCell>
                  <div className="flex flex-col space-y-1">
                    {business.isNewListing && (
                      <Badge variant="default" className="text-xs w-fit">
                        <Building2 className="mr-1 h-3 w-3" />
                        New Listing
                      </Badge>
                    )}
                    {business.isNewReviews && (
                      <Badge variant="secondary" className="text-xs w-fit">
                        <TrendingUp className="mr-1 h-3 w-3" />
                        New Reviews
                      </Badge>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      {formatDistanceToNow(new Date(business.firstSeenAt), { addSuffix: true })}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => addToProspects(business.id, business.companyName)}
                      className="text-xs"
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Add to Prospects
                    </Button>
                  </div>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>

      {newBusinesses.length === 0 && (
        <div className="text-center py-12">
          <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No new businesses detected</h3>
          <p className="text-muted-foreground mb-4">
            New businesses will appear here when our monitoring systems detect them
          </p>
          <Button variant="outline">
            Configure Detection Settings
          </Button>
        </div>
      )}
    </div>
  )
}
