'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Search,
  Play,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  RefreshCw,
  MapPin,
  Briefcase,
  Zap,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'

interface ScrapeJob {
  id: string
  status: string
  payload: string
  result: string | null
  createdAt: string
  completedAt: string | null
}

export default function ScrapePage() {
  const [categories, setCategories] = useState<string[]>([])
  const [cities, setCities] = useState<string[]>([])
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [availableCities, setAvailableCities] = useState<string[]>([])
  const [customSearch, setCustomSearch] = useState('')
  const [maxResults, setMaxResults] = useState(50)
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [recentJobs, setRecentJobs] = useState<ScrapeJob[]>([])
  const [activeRun, setActiveRun] = useState<{ runId: string; jobId: string; datasetId: string } | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchOptions()
    fetchRecentJobs()
  }, [])

  const fetchOptions = async () => {
    try {
      const response = await fetch('/api/scrape/google-maps')
      if (response.ok) {
        const data = await response.json()
        setAvailableCategories(data.categories || [])
        setAvailableCities(data.cities || [])
      }
    } catch (error) {
      console.error('Error fetching options:', error)
    }
  }

  const fetchRecentJobs = async () => {
    try {
      const response = await fetch('/api/scrape/status')
      if (response.ok) {
        const data = await response.json()
        setRecentJobs(data.jobs || [])
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
    }
  }

  const startScrape = async (mode: 'quick' | 'bulk' | 'custom') => {
    setLoading(true)
    try {
      const response = await fetch('/api/scrape/google-maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          categories: mode === 'bulk' ? categories : undefined,
          cities: mode === 'bulk' ? cities : undefined,
          customSearch: mode === 'custom' ? customSearch : undefined,
          maxResults,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setActiveRun({
          runId: data.apifyRunId,
          jobId: data.jobId,
          datasetId: data.datasetId,
        })
        toast({
          title: 'Scrape Started!',
          description: data.message,
        })
        fetchRecentJobs()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start scrape',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const checkAndImport = async () => {
    if (!activeRun) return

    setImporting(true)
    try {
      const response = await fetch('/api/scrape/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activeRun),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Import Complete!',
          description: data.message,
        })
        setActiveRun(null)
        fetchRecentJobs()
      } else {
        toast({
          title: 'Not Ready',
          description: data.message,
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to import results',
        variant: 'destructive',
      })
    } finally {
      setImporting(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const parseJobResult = (result: string | null) => {
    if (!result) return null
    try {
      return JSON.parse(result)
    } catch {
      return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-2 mb-2">
          <Search className="h-8 w-8 text-green-500" />
          <span>Lead Scraper</span>
        </h1>
        <p className="text-muted-foreground">
          Scrape Google Maps for new prospects and auto-import them with scoring
        </p>
      </div>

      {/* Active Run Banner */}
      {activeRun && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                  <div>
                    <p className="font-semibold">Scrape in Progress</p>
                    <p className="text-sm text-muted-foreground">
                      Run ID: {activeRun.runId}
                    </p>
                  </div>
                </div>
                <Button onClick={checkAndImport} disabled={importing}>
                  {importing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Check & Import Results
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Scrape Options */}
      <Tabs defaultValue="quick" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="quick">
            <Zap className="h-4 w-4 mr-2" />
            Quick Scrape
          </TabsTrigger>
          <TabsTrigger value="bulk">
            <Briefcase className="h-4 w-4 mr-2" />
            Bulk Scrape
          </TabsTrigger>
          <TabsTrigger value="custom">
            <Search className="h-4 w-4 mr-2" />
            Custom Search
          </TabsTrigger>
        </TabsList>

        {/* Quick Scrape */}
        <TabsContent value="quick">
          <Card>
            <CardHeader>
              <CardTitle>Quick Scrape</CardTitle>
              <CardDescription>
                Scrape top 3 categories (plumber, HVAC, roofing) across top 5 Minnesota cities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge>Plumber</Badge>
                  <Badge>HVAC Contractor</Badge>
                  <Badge>Roofing Contractor</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Minneapolis</Badge>
                  <Badge variant="outline">St Paul</Badge>
                  <Badge variant="outline">Bloomington</Badge>
                  <Badge variant="outline">Brooklyn Park</Badge>
                  <Badge variant="outline">Plymouth</Badge>
                </div>
                <Button
                  onClick={() => startScrape('quick')}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Start Quick Scrape (~300 results)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bulk Scrape */}
        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Scrape</CardTitle>
              <CardDescription>
                Select specific categories and cities to scrape
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Categories */}
                <div className="space-y-3">
                  <Label>Categories ({categories.length} selected)</Label>
                  <div className="h-64 overflow-y-auto border rounded-lg p-3 space-y-2">
                    {availableCategories.map((cat) => (
                      <div key={cat} className="flex items-center space-x-2">
                        <Checkbox
                          id={`cat-${cat}`}
                          checked={categories.includes(cat)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setCategories([...categories, cat])
                            } else {
                              setCategories(categories.filter((c) => c !== cat))
                            }
                          }}
                        />
                        <label htmlFor={`cat-${cat}`} className="text-sm capitalize">
                          {cat}
                        </label>
                      </div>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCategories(availableCategories)}
                    >
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCategories([])}
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                {/* Cities */}
                <div className="space-y-3">
                  <Label>Cities ({cities.length} selected)</Label>
                  <div className="h-64 overflow-y-auto border rounded-lg p-3 space-y-2">
                    {availableCities.map((city) => (
                      <div key={city} className="flex items-center space-x-2">
                        <Checkbox
                          id={`city-${city}`}
                          checked={cities.includes(city)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setCities([...cities, city])
                            } else {
                              setCities(cities.filter((c) => c !== city))
                            }
                          }}
                        />
                        <label htmlFor={`city-${city}`} className="text-sm">
                          <MapPin className="h-3 w-3 inline mr-1" />
                          {city}
                        </label>
                      </div>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCities(availableCities)}
                    >
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCities([])}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <Label>Max Results Per Search</Label>
                  <Input
                    type="number"
                    value={maxResults}
                    onChange={(e) => setMaxResults(parseInt(e.target.value) || 50)}
                    min={10}
                    max={200}
                    className="w-32"
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  Estimated results: {categories.length * cities.length * maxResults} prospects
                </div>
                <Button
                  onClick={() => startScrape('bulk')}
                  disabled={loading || categories.length === 0 || cities.length === 0}
                  className="w-full"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Start Bulk Scrape
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Search */}
        <TabsContent value="custom">
          <Card>
            <CardHeader>
              <CardTitle>Custom Search</CardTitle>
              <CardDescription>
                Search for any business type in any location
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Search Query</Label>
                  <Input
                    value={customSearch}
                    onChange={(e) => setCustomSearch(e.target.value)}
                    placeholder="e.g., electricians in Duluth, MN"
                  />
                </div>
                <div>
                  <Label>Max Results</Label>
                  <Input
                    type="number"
                    value={maxResults}
                    onChange={(e) => setMaxResults(parseInt(e.target.value) || 50)}
                    min={10}
                    max={500}
                    className="w-32"
                  />
                </div>
                <Button
                  onClick={() => startScrape('custom')}
                  disabled={loading || !customSearch}
                  className="w-full"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  Search & Import
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Jobs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Scrape Jobs</CardTitle>
            <CardDescription>History of your scraping activity</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchRecentJobs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {recentJobs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No scrape jobs yet. Start one above!
            </p>
          ) : (
            <div className="space-y-3">
              {recentJobs.map((job) => {
                const payload = JSON.parse(job.payload || '{}')
                const result = parseJobResult(job.result)

                return (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(job.status)}
                      <div>
                        <p className="font-medium text-sm">
                          {payload.searchQuery || 'Scrape Job'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {result && (
                        <div className="text-sm">
                          <span className="text-green-600">{result.imported} new</span>
                          {' / '}
                          <span className="text-yellow-600">{result.duplicates} updated</span>
                        </div>
                      )}
                      <Badge variant={job.status === 'completed' ? 'default' : 'secondary'}>
                        {job.status}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
