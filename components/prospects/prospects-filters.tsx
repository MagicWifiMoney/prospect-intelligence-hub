
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Search, Filter, X } from 'lucide-react'

export function ProspectsFilters() {
  const [filters, setFilters] = useState({
    search: '',
    businessType: 'all',
    city: 'all',
    isHotLead: false,
    hasAnomalies: false,
    scoreRange: [0, 100],
  })

  const [businessTypes, setBusinessTypes] = useState<string[]>([])
  const [cities, setCities] = useState<string[]>([])

  // Load filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        // In a real app, these would come from API endpoints
        setBusinessTypes(['Painter', 'Contractor', 'Bath Remodeler', 'Plumber', 'Electrician'])
        setCities(['Plymouth', 'Minnetonka', 'Wayzata', 'Minneapolis', 'St. Paul'])
      } catch (error) {
        console.error('Error loading filter options:', error)
      }
    }

    loadFilterOptions()
  }, [])

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      businessType: 'all',
      city: 'all',
      isHotLead: false,
      hasAnomalies: false,
      scoreRange: [0, 100],
    })
  }

  const applyFilters = () => {
    // In a real app, this would trigger the prospect table to refresh with filters
    console.log('Applying filters:', filters)
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex space-x-4">
        <div className="flex-1">
          <Label htmlFor="search">Search Prospects</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by company name, type, city, phone, or website..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Filter Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Label>Business Type</Label>
          <Select
            value={filters.businessType}
            onValueChange={(value) => handleFilterChange('businessType', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {businessTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>City</Label>
          <Select
            value={filters.city}
            onValueChange={(value) => handleFilterChange('city', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Cities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {cities.map(city => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label>Special Filters</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hotLeads"
                checked={filters.isHotLead}
                onCheckedChange={(checked) => handleFilterChange('isHotLead', checked)}
              />
              <Label htmlFor="hotLeads" className="text-sm">Hot Leads Only</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="anomalies"
                checked={filters.hasAnomalies}
                onCheckedChange={(checked) => handleFilterChange('hasAnomalies', checked)}
              />
              <Label htmlFor="anomalies" className="text-sm">Has Anomalies</Label>
            </div>
          </div>
        </div>

        <div>
          <Label>Lead Score Range: {filters.scoreRange[0]}-{filters.scoreRange[1]}%</Label>
          <div className="pt-3">
            <Slider
              value={filters.scoreRange}
              onValueChange={(value) => handleFilterChange('scoreRange', value)}
              max={100}
              min={0}
              step={5}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4 border-t">
        <Button variant="outline" onClick={clearFilters} className="space-x-2">
          <X className="h-4 w-4" />
          <span>Clear Filters</span>
        </Button>
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={applyFilters} className="space-x-2">
            <Filter className="h-4 w-4" />
            <span>Apply Filters</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
