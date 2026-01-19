'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Download, Calendar, Clock, TrendingUp, Share2, Copy, ExternalLink, Users, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'

export function ReportsOverview() {
  const { toast } = useToast()
  const [aiReports, setAiReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAiReports()
  }, [])

  const fetchAiReports = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/reports/generate')
      if (response.ok) {
        const data = await response.json()
        setAiReports(data.reports || [])
      }
    } catch (error) {
      console.error('Error fetching AI reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`
    })
  }

  const handleGenerateReport = (reportType: string) => {
    toast({
      title: "Report Generation Started",
      description: `Your ${reportType} report is being generated and will be available for download shortly.`,
    })
  }

  const reports = [
    {
      title: 'Weekly Prospect Summary',
      description: 'Overview of new prospects, hot leads, and performance metrics',
      type: 'Performance',
      lastGenerated: '2 hours ago',
      status: 'ready',
      icon: TrendingUp,
    },
    {
      title: 'Lead Scoring Analysis',
      description: 'Detailed analysis of lead scores and qualification metrics',
      type: 'Analytics',
      lastGenerated: '1 day ago',
      status: 'ready',
      icon: FileText,
    },
    {
      title: 'Market Trends Report',
      description: 'Latest market trends and industry insights compilation',
      type: 'Market Intelligence',
      lastGenerated: '3 days ago',
      status: 'generating',
      icon: Calendar,
    },
    {
      title: 'Outreach Effectiveness',
      description: 'Campaign performance and conversion rate analysis',
      type: 'Campaign',
      lastGenerated: '1 week ago',
      status: 'ready',
      icon: TrendingUp,
    },
  ]

  return (
    <div className="space-y-6">
      {/* AI Shareable Reports Section */}
      {aiReports.length > 0 && (
        <Card className="border-cyan-500/20 bg-cyan-500/5">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-cyan-400" />
              <span>AI Shareable Reports</span>
            </CardTitle>
            <CardDescription>
              Recently generated landing pages for your prospects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {aiReports.slice(0, 6).map((report, index) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 glass border rounded-xl hover:border-cyan-500/50 transition-all bg-white/5"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm truncate max-w-[150px]">
                        {report.prospect?.companyName || 'Unknown Prospect'}
                      </h4>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                        {new Date(report.generatedAt).toLocaleDateString()} Audit
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-400">
                      AI Powered
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-3 text-[10px] text-gray-400 mb-4">
                    <span className="flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      {report.views} views
                    </span>
                    <span>•</span>
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(report.expiresAt) > new Date() ? 'Active' : 'Expired'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-[10px] h-8"
                      onClick={() => copyToClipboard(`${window.location.origin}/reports/${report.shareToken}`, 'Share link')}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Link
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="text-[10px] h-8 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-none"
                      onClick={() => window.open(`/reports/${report.shareToken}`, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Pre-configured Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-purple-500" />
            <span>Pre-configured Reports</span>
          </CardTitle>
          <CardDescription>
            Templates ready for internal analysis and performance tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.map((report, index) => (
              <motion.div
                key={report.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 border rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <report.icon className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold text-sm">{report.title}</h3>
                  </div>
                  <Badge
                    variant={report.status === 'ready' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {report.status === 'ready' ? 'Ready' : 'Generating'}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground mb-3">
                  {report.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <span className="font-medium">{report.type}</span>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{report.lastGenerated}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGenerateReport(report.title)}
                      disabled={report.status === 'generating'}
                      className="text-xs"
                    >
                      Generate New
                    </Button>
                    {report.status === 'ready' && (
                      <Button
                        size="sm"
                        onClick={() => handleGenerateReport(report.title)}
                        className="text-xs"
                      >
                        <Download className="mr-1 h-3 w-3" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
