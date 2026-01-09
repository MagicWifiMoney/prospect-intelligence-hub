
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Download, Calendar, Clock, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'

export function ReportsOverview() {
  const { toast } = useToast()

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-purple-500" />
          <span>Available Reports</span>
        </CardTitle>
        <CardDescription>
          Pre-configured reports ready for generation and download
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
  )
}
