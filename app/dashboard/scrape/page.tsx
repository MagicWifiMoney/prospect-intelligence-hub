'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  Radar,
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
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-400" />
      case 'running':
        return <Loader2 className="h-4 w-4 text-cyan-400 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-amber-400" />
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
        <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-2 mb-2 text-white font-display">
          <Radar className="h-8 w-8 text-cyan-400" />
          <span>Lead Scraper</span>
        </h1>
        <p className="text-gray-400">
          Scrape Google Maps for new prospects and auto-import them with scoring
        </p>
      </div>

      {/* Active Run Banner */}
      {activeRun && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="backdrop-blur-xl bg-gradient-to-r from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Loader2 className="h-6 w-6 text-cyan-400 animate-spin" />
                <div>
                  <p className="font-semibold text-white">Scrape in Progress</p>
                  <p className="text-sm text-gray-400">
                    Run ID: {activeRun.runId}
                  </p>
                </div>
              </div>
              <Button
                onClick={checkAndImport}
                disabled={importing}
                className="bg-cyan-500 hover:bg-cyan-600 text-white"
              >
                {importing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Check & Import Results
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Scrape Options */}
      <Tabs defaultValue="quick" className="space-y-4">
        <TabsList className="bg-white/5 border border-white/10 p-1">
          <TabsTrigger value="quick" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400">
            <Zap className="h-4 w-4 mr-2" />
            Quick Scrape
          </TabsTrigger>
          <TabsTrigger value="bulk" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400">
            <Briefcase className="h-4 w-4 mr-2" />
            Bulk Scrape
          </TabsTrigger>
          <TabsTrigger value="custom" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400">
            <Search className="h-4 w-4 mr-2" />
            Custom Search
          </TabsTrigger>
        </TabsList>

        {/* Quick Scrape */}
        <TabsContent value="quick">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white font-display mb-2">Quick Scrape</h3>
            <p className="text-sm text-gray-500 mb-4">
              Scrape top 3 categories (plumber, HVAC, roofing) across top 5 Minnesota cities
            </p>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">Plumber</Badge>
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">HVAC Contractor</Badge>
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">Roofing Contractor</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-white/10 text-gray-300 border-white/20">Minneapolis</Badge>
                <Badge className="bg-white/10 text-gray-300 border-white/20">St Paul</Badge>
                <Badge className="bg-white/10 text-gray-300 border-white/20">Bloomington</Badge>
                <Badge className="bg-white/10 text-gray-300 border-white/20">Brooklyn Park</Badge>
                <Badge className="bg-white/10 text-gray-300 border-white/20">Plymouth</Badge>
              </div>
              <Button
                onClick={() => startScrape('quick')}
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Start Quick Scrape (~300 results)
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Bulk Scrape */}
        <TabsContent value="bulk">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white font-display mb-2">Bulk Scrape</h3>
            <p className="text-sm text-gray-500 mb-4">
              Select specific categories and cities to scrape
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Categories */}
              <div className="space-y-3">
                <Label className="text-gray-300">Categories ({categories.length} selected)</Label>
                <div className="h-64 overflow-y-auto bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
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
                        className="border-white/20 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                      />
                      <label htmlFor={`cat-${cat}`} className="text-sm text-gray-300 capitalize cursor-pointer">
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
                    className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCategories([])}
                    className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                  >
                    Clear
                  </Button>
                </div>
              </div>

              {/* Cities */}
              <div className="space-y-3">
                <Label className="text-gray-300">Cities ({cities.length} selected)</Label>
                <div className="h-64 overflow-y-auto bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
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
                        className="border-white/20 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                      />
                      <label htmlFor={`city-${city}`} className="text-sm text-gray-300 cursor-pointer">
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
                    className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCities([])}
                    className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <Label className="text-gray-300">Max Results Per Search</Label>
                <Input
                  type="number"
                  value={maxResults}
                  onChange={(e) => setMaxResults(parseInt(e.target.value) || 50)}
                  min={10}
                  max={200}
                  className="w-32 bg-white/5 border-white/10 text-white mt-1"
                />
              </div>
              <div className="text-sm text-gray-500">
                Estimated results: <span className="text-cyan-400 font-medium">{categories.length * cities.length * maxResults}</span> prospects
              </div>
              <Button
                onClick={() => startScrape('bulk')}
                disabled={loading || categories.length === 0 || cities.length === 0}
                className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Start Bulk Scrape
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Custom Search */}
        <TabsContent value="custom">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white font-display mb-2">Custom Search</h3>
            <p className="text-sm text-gray-500 mb-4">
              Search for any business type in any location
            </p>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Search Query</Label>
                <Input
                  value={customSearch}
                  onChange={(e) => setCustomSearch(e.target.value)}
                  placeholder="e.g., electricians in Duluth, MN"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 mt-1"
                />
              </div>
              <div>
                <Label className="text-gray-300">Max Results</Label>
                <Input
                  type="number"
                  value={maxResults}
                  onChange={(e) => setMaxResults(parseInt(e.target.value) || 50)}
                  min={10}
                  max={500}
                  className="w-32 bg-white/5 border-white/10 text-white mt-1"
                />
              </div>
              <Button
                onClick={() => startScrape('custom')}
                disabled={loading || !customSearch}
                className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Search & Import
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Recent Jobs */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white font-display">Recent Scrape Jobs</h3>
            <p className="text-sm text-gray-500">History of your scraping activity</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRecentJobs}
            className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        <div className="p-6">
          {recentJobs.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
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
                    className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(job.status)}
                      <div>
                        <p className="font-medium text-sm text-white">
                          {payload.searchQuery || 'Scrape Job'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {result && (
                        <div className="text-sm">
                          <span className="text-green-400">{result.imported} new</span>
                          {' / '}
                          <span className="text-amber-400">{result.duplicates} updated</span>
                        </div>
                      )}
                      <Badge className={job.status === 'completed' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-white/10 text-gray-300 border-white/20'}>
                        {job.status}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
