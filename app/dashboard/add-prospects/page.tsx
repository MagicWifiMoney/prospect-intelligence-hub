
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Plus, Upload, Link as LinkIcon, Loader2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function AddProspectsPage() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Manual entry form state
  const [formData, setFormData] = useState({
    business_name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    website: '',
    gmb_url: '',
    category: '',
  })

  // Bulk URL entry state
  const [urls, setUrls] = useState('')

  // CSV upload state
  const [csvFile, setCsvFile] = useState<File | null>(null)

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Failed to add prospect')

      toast({
        title: "Prospect Added",
        description: `${formData.business_name} has been added successfully.`,
      })

      // Reset form
      setFormData({
        business_name: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        phone: '',
        website: '',
        gmb_url: '',
        category: '',
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add prospect. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBulkUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const urlList = urls.split('\n').filter(url => url.trim())

    if (urlList.length === 0) {
      toast({
        title: "No URLs Provided",
        description: "Please enter at least one URL or GMB link.",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/prospects/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: urlList }),
      })

      if (!response.ok) throw new Error('Failed to import URLs')

      const data = await response.json()

      toast({
        title: "Import Started",
        description: `Processing ${urlList.length} URLs. This may take a few minutes.`,
      })

      setUrls('')
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Failed to start import. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCsvUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!csvFile) {
      toast({
        title: "No File Selected",
        description: "Please select a CSV file to upload.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', csvFile)

      const response = await fetch('/api/prospects/import', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Failed to upload CSV')

      const data = await response.json()

      toast({
        title: "Import Successful",
        description: `Imported ${data.count || 0} prospects from CSV.`,
      })

      setCsvFile(null)
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload CSV. Please check the format and try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add Prospects</h1>
        <p className="text-muted-foreground mt-1">
          Add new prospects manually, via URLs, or bulk import from CSV
        </p>
      </div>

      <Tabs defaultValue="manual" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="manual">
            <Plus className="h-4 w-4 mr-2" />
            Manual Entry
          </TabsTrigger>
          <TabsTrigger value="urls">
            <LinkIcon className="h-4 w-4 mr-2" />
            Bulk URLs
          </TabsTrigger>
          <TabsTrigger value="csv">
            <Upload className="h-4 w-4 mr-2" />
            CSV Upload
          </TabsTrigger>
        </TabsList>

        {/* Manual Entry */}
        <TabsContent value="manual">
          <Card>
            <CardHeader>
              <CardTitle>Add Prospect Manually</CardTitle>
              <CardDescription>
                Enter business information to add a single prospect
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="business_name">Business Name *</Label>
                    <Input
                      id="business_name"
                      required
                      value={formData.business_name}
                      onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                      placeholder="ABC Painting Services"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Input
                      id="category"
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Painter, Bath Remodeler, etc."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Main St"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Minneapolis"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="MN"
                      maxLength={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">ZIP Code</Label>
                    <Input
                      id="zip"
                      value={formData.zip}
                      onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                      placeholder="55401"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gmb_url">Google My Business URL</Label>
                  <Input
                    id="gmb_url"
                    type="url"
                    value={formData.gmb_url}
                    onChange={(e) => setFormData({ ...formData, gmb_url: e.target.value })}
                    placeholder="https://maps.google.com/..."
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding Prospect...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Prospect
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bulk URLs */}
        <TabsContent value="urls">
          <Card>
            <CardHeader>
              <CardTitle>Import from URLs</CardTitle>
              <CardDescription>
                Paste Google My Business URLs or website URLs (one per line)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBulkUrlSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="urls">URLs</Label>
                  <Textarea
                    id="urls"
                    value={urls}
                    onChange={(e) => setUrls(e.target.value)}
                    placeholder="https://maps.google.com/...&#10;https://example.com&#10;https://maps.google.com/..."
                    rows={12}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter one URL per line. We'll automatically scrape business information from Google My Business or websites.
                  </p>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing URLs...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="mr-2 h-4 w-4" />
                      Import URLs
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CSV Upload */}
        <TabsContent value="csv">
          <Card>
            <CardHeader>
              <CardTitle>Import from CSV</CardTitle>
              <CardDescription>
                Upload a CSV file with prospect information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCsvUpload} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="csv">CSV File</Label>
                  <Input
                    id="csv"
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Expected columns: business_name, address, city, state, zip, phone, website, gmb_url, category
                  </p>
                </div>

                {csvFile && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Selected file:</p>
                    <p className="text-sm text-muted-foreground">{csvFile.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(csvFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                )}

                <Button type="submit" disabled={loading || !csvFile} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload CSV
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
