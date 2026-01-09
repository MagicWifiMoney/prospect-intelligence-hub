
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Download, Filter, FileText } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function ExportTools() {
  const { toast } = useToast()
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'companyName',
    'businessType',
    'city',
    'phone',
    'email',
    'website'
  ])
  const [exportFormat, setExportFormat] = useState('csv')
  const [filterType, setFilterType] = useState('all')

  const availableFields = [
    { id: 'companyName', label: 'Company Name' },
    { id: 'businessType', label: 'Business Type' },
    { id: 'address', label: 'Address' },
    { id: 'city', label: 'City' },
    { id: 'phone', label: 'Phone' },
    { id: 'email', label: 'Email' },
    { id: 'website', label: 'Website' },
    { id: 'googleRating', label: 'Google Rating' },
    { id: 'reviewCount', label: 'Review Count' },
    { id: 'leadScore', label: 'Lead Score' },
    { id: 'isHotLead', label: 'Hot Lead Status' },
  ]

  const handleFieldToggle = (fieldId: string) => {
    setSelectedFields(prev =>
      prev.includes(fieldId)
        ? prev.filter(id => id !== fieldId)
        : [...prev, fieldId]
    )
  }

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: `Exporting ${selectedFields.length} fields in ${exportFormat.toUpperCase()} format for ${filterType} prospects.`,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Download className="h-5 w-5 text-green-500" />
          <span>Export Prospects</span>
        </CardTitle>
        <CardDescription>
          Customize and export prospect data for external analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Export Filters */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Export Scope</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select prospects to export" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prospects</SelectItem>
                  <SelectItem value="hot-leads">Hot Leads Only</SelectItem>
                  <SelectItem value="new-businesses">New Businesses</SelectItem>
                  <SelectItem value="high-score">High Score (75+)</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="not-contacted">Not Contacted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Export Format</Label>
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Field Selection */}
          <div className="lg:col-span-2">
            <Label className="text-sm font-medium mb-3 block">Select Fields to Export</Label>
            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto border rounded-lg p-4">
              {availableFields.map((field) => (
                <div key={field.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={field.id}
                    checked={selectedFields.includes(field.id)}
                    onCheckedChange={() => handleFieldToggle(field.id)}
                  />
                  <Label htmlFor={field.id} className="text-sm cursor-pointer">
                    {field.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Export Summary & Actions */}
        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              <p>Export Preview: {selectedFields.length} fields selected</p>
              <p>Estimated records: {filterType === 'all' ? '598' : filterType === 'hot-leads' ? '45' : '156'} prospects</p>
            </div>
            
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                className="space-x-2"
                onClick={() => {
                  toast({
                    title: "Data Preview",
                    description: `Previewing ${selectedFields.length} fields for ${filterType} prospects`,
                  })
                }}
              >
                <Filter className="h-4 w-4" />
                <span>Preview</span>
              </Button>
              <Button onClick={handleExport} className="space-x-2">
                <Download className="h-4 w-4" />
                <span>Export Now</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
