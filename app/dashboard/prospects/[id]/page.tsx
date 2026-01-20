
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import {
  ArrowLeft,
  Star,
  MapPin,
  Phone,
  Mail,
  Globe,
  ExternalLink,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  MessageSquare,
  Calendar,
  Tag,
  Copy,
  CheckCircle2,
  Loader2,
  Share2,
  Users,
  Send
} from 'lucide-react'
import { motion } from 'framer-motion'
import { OutreachEmailModal } from '@/components/prospects/outreach-email-modal'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export default function ProspectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [prospect, setProspect] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generatingInsights, setGeneratingInsights] = useState(false)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [insights, setInsights] = useState<any>(null)
  const [reports, setReports] = useState<any[]>([])
  const [notes, setNotes] = useState('')
  const [tags, setTags] = useState('')
  const [saving, setSaving] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)

  const fetchReports = useCallback(async () => {
    try {
      const response = await fetch(`/api/reports/generate?prospectId=${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setReports(data.reports || [])
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
    }
  }, [params.id])

  const fetchProspect = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/prospects/${params.id}`)

      if (response.ok) {
        const data = await response.json()
        setProspect(data.prospect)
        setNotes(data.prospect.notes || '')
        setTags(data.prospect.tags || '')

        // Parse pain points if available
        if (data.prospect.painPoints) {
          try {
            const painPoints = JSON.parse(data.prospect.painPoints)
            setInsights({
              outreachStrategy: data.prospect.outreachStrategy,
              painPoints,
              valueProposition: data.prospect.aiRecommendations,
              sentimentSummary: '',
              competitiveGaps: []
            })
          } catch (e) {
            // Ignore parsing errors
          }
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to load prospect details",
          variant: "destructive"
        })
        router.push('/dashboard/prospects')
      }
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: "Failed to load prospect",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [params.id, toast, router])

  useEffect(() => {
    fetchProspect()
    fetchReports()
  }, [fetchProspect, fetchReports])

  const generateInsights = async () => {
    try {
      setGeneratingInsights(true)
      const response = await fetch(`/api/prospects/${params.id}/insights`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        setInsights(data.insights)
        toast({
          title: "✨ Insights Generated",
          description: "AI analysis complete!"
        })
        // Refresh prospect data
        fetchProspect()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to generate insights",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate insights",
        variant: "destructive"
      })
    } finally {
      setGeneratingInsights(false)
    }
  }
  const generateReport = async () => {
    try {
      setGeneratingReport(true)
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospectId: params.id })
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "🚀 Report Generated",
          description: data.cached ? "Retrieved recent report" : "New AI report created!"
        })
        fetchReports()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to generate report",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive"
      })
    } finally {
      setGeneratingReport(false)
    }
  }

  const saveNotes = async () => {
    try {
      setSaving(true)
      const response = await fetch(`/api/prospects/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes, tags })
      })

      if (response.ok) {
        toast({
          title: "Saved",
          description: "Notes and tags updated"
        })
        fetchProspect()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const markAsContacted = async () => {
    try {
      const response = await fetch(`/api/prospects/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactedAt: new Date().toISOString() })
      })

      if (response.ok) {
        toast({
          title: "Updated",
          description: "Marked as contacted"
        })
        fetchProspect()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      })
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!prospect) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Prospect Not Found</h2>
        <Link href="/dashboard/prospects">
          <Button>Back to Prospects</Button>
        </Link>
      </div>
    )
  }

  const anomalies = prospect.anomaliesDetected ? prospect.anomaliesDetected.split(',') : []

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard/prospects">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Prospects
          </Button>
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold">{prospect.companyName}</h1>
              {prospect.isHotLead && (
                <Badge className="bg-orange-500">
                  <Star className="mr-1 h-3 w-3" />
                  Hot Lead
                </Badge>
              )}
              {prospect.isConverted && (
                <Badge className="bg-green-500">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Converted
                </Badge>
              )}
            </div>

            {prospect.businessType && (
              <Badge variant="secondary" className="mr-2">
                {prospect.businessType}
              </Badge>
            )}
            {prospect.city && (
              <span className="text-muted-foreground flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>{prospect.city}, Minnesota</span>
              </span>
            )}
          </div>

          <div className="flex space-x-2">
            {!prospect.contactedAt && (
              <Button onClick={markAsContacted}>
                Mark as Contacted
              </Button>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      onClick={() => setShowEmailModal(true)}
                      disabled={!prospect.ownerEmail && !prospect.email}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Generate Outreach Email
                    </Button>
                  </span>
                </TooltipTrigger>
                {!prospect.ownerEmail && !prospect.email && (
                  <TooltipContent>
                    <p>No email available for this prospect</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            <Button
              onClick={generateReport}
              disabled={generatingReport}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              {generatingReport ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Share2 className="mr-2 h-4 w-4" />
                  Generate Shareable Report
                </>
              )}
            </Button>
            <Button
              onClick={generateInsights}
              disabled={generatingInsights}
              variant="outline"
            >
              {generatingInsights ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate AI Insights
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <div>
                    <p className="text-2xl font-bold">{prospect.googleRating || 'N/A'}</p>
                    <p className="text-xs text-muted-foreground">Google Rating</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{prospect.reviewCount || 0}</p>
                    <p className="text-xs text-muted-foreground">Reviews</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {prospect.leadScore ? `${Math.round(prospect.leadScore)}%` : 'N/A'}
                    </p>
                    <p className="text-xs text-muted-foreground">Lead Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-2xl font-bold">{anomalies.length}</p>
                    <p className="text-xs text-muted-foreground">Anomalies</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {prospect.phone && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{prospect.phone}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(prospect.phone, 'Phone number')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {prospect.email && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{prospect.email}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(prospect.email, 'Email')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {prospect.website && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <a
                      href={prospect.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {prospect.website}
                    </a>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(prospect.website, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {prospect.gbpUrl && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Google Business Profile</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(prospect.gbpUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {prospect.address && (
                <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <span>{prospect.address}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Insights */}
          {insights && (
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span>AI-Powered Insights</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {insights.outreachStrategy && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center space-x-2">
                      <Phone className="h-4 w-4" />
                      <span>Outreach Strategy</span>
                    </h4>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                      {insights.outreachStrategy}
                    </p>
                  </div>
                )}

                {insights.painPoints && insights.painPoints.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Pain Points</span>
                    </h4>
                    <ul className="space-y-2">
                      {insights.painPoints.map((point: string, idx: number) => (
                        <li key={idx} className="text-sm flex items-start space-x-2">
                          <span className="text-primary mt-1">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {insights.valueProposition && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4" />
                      <span>Value Proposition</span>
                    </h4>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                      {insights.valueProposition}
                    </p>
                  </div>
                )}

                {insights.competitiveGaps && insights.competitiveGaps.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center space-x-2">
                      <Star className="h-4 w-4" />
                      <span>Opportunities</span>
                    </h4>
                    <ul className="space-y-2">
                      {insights.competitiveGaps.map((gap: string, idx: number) => (
                        <li key={idx} className="text-sm flex items-start space-x-2">
                          <span className="text-primary mt-1">•</span>
                          <span>{gap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Shareable Reports */}
          {reports.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Share2 className="h-5 w-5 text-cyan-500" />
                  <span>Shareable Reports</span>
                </CardTitle>
                <CardDescription>
                  AI-generated landing pages for this prospect
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <p className="font-medium text-sm">
                          {new Date(report.generatedAt).toLocaleDateString()} Audit
                        </p>
                        <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                          <span className="flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            {report.views} views
                          </span>
                          <span>•</span>
                          <span>Expires {new Date(report.expiresAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(`${window.location.origin}/reports/${report.shareToken}`, 'Share link')}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Link
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`/reports/${report.shareToken}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reviews */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Reviews</CardTitle>
              <CardDescription>
                {prospect.reviews?.length || 0} reviews available
              </CardDescription>
            </CardHeader>
            <CardContent>
              {prospect.reviews && prospect.reviews.length > 0 ? (
                <div className="space-y-4">
                  {prospect.reviews.slice(0, 5).map((review: any) => (
                    <div key={review.id} className="border-b pb-4 last:border-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < (review.rating || 0)
                                ? 'text-yellow-500 fill-current'
                                : 'text-gray-300'
                                }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium">{review.author}</span>
                        <span className="text-xs text-muted-foreground">
                          {review.publishedAt
                            ? new Date(review.publishedAt).toLocaleDateString()
                            : ''}
                        </span>
                      </div>
                      {review.text && (
                        <p className="text-sm text-muted-foreground">{review.text}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No reviews available</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Notes & Activity */}
        <div className="space-y-6">
          {/* Notes & Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Notes & Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Tags</label>
                <Input
                  placeholder="e.g., follow-up, hot-lead, contacted"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Notes</label>
                <Textarea
                  placeholder="Add your notes here..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={6}
                />
              </div>

              <Button
                onClick={saveNotes}
                disabled={saving}
                className="w-full"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Notes & Tags'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Lead Score Breakdown */}
          {prospect.leadScore && (
            <Card>
              <CardHeader>
                <CardTitle>Lead Score Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Overall Score</span>
                      <span className="text-sm font-bold">
                        {Math.round(prospect.leadScore)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                        style={{ width: `${prospect.leadScore}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Rating Quality</span>
                      <span className="font-medium">
                        {prospect.googleRating >= 4.5 ? 'Excellent' :
                          prospect.googleRating >= 4.0 ? 'Good' :
                            prospect.googleRating >= 3.5 ? 'Fair' : 'Poor'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Review Count</span>
                      <span className="font-medium">
                        {prospect.reviewCount >= 50 ? 'High' :
                          prospect.reviewCount >= 20 ? 'Medium' : 'Low'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Digital Presence</span>
                      <span className="font-medium">
                        {prospect.website ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Anomalies */}
          {anomalies.length > 0 && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Anomalies Detected</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {anomalies.map((anomaly: string, idx: number) => (
                    <li key={idx} className="flex items-center space-x-2 text-sm">
                      <span className="w-2 h-2 bg-red-500 rounded-full" />
                      <span className="capitalize">{anomaly.replace(/_/g, ' ')}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {prospect.activities && prospect.activities.length > 0 ? (
                <div className="space-y-3">
                  {prospect.activities.slice(0, 10).map((activity: any) => (
                    <div key={activity.id} className="flex items-start space-x-3 text-sm">
                      <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium">{activity.content}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No activity yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Outreach Email Modal */}
      <OutreachEmailModal
        open={showEmailModal}
        onOpenChange={setShowEmailModal}
        prospectId={prospect.id}
        companyName={prospect.companyName}
        ownerEmail={prospect.ownerEmail}
        email={prospect.email}
        onEmailSent={fetchProspect}
      />
    </div>
  )
}
