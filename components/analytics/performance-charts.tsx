
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { TrendingUp, Calendar } from 'lucide-react'

export function PerformanceCharts() {
  // Mock data for charts
  const trendData = [
    { month: 'Jan', prospects: 45, hotLeads: 8, conversions: 3 },
    { month: 'Feb', prospects: 52, hotLeads: 12, conversions: 4 },
    { month: 'Mar', prospects: 48, hotLeads: 9, conversions: 5 },
    { month: 'Apr', prospects: 61, hotLeads: 15, conversions: 7 },
    { month: 'May', prospects: 55, hotLeads: 11, conversions: 6 },
    { month: 'Jun', prospects: 67, hotLeads: 18, conversions: 8 },
    { month: 'Jul', prospects: 72, hotLeads: 21, conversions: 9 },
  ]

  const scoreData = [
    { range: '0-20', count: 12 },
    { range: '21-40', count: 34 },
    { range: '41-60', count: 89 },
    { range: '61-80', count: 156 },
    { range: '81-100', count: 67 },
  ]

  const conversionData = [
    { source: 'Google Search', prospects: 245, conversions: 23 },
    { source: 'Referrals', prospects: 156, conversions: 18 },
    { source: 'Direct', prospects: 98, conversions: 12 },
    { source: 'Social Media', prospects: 67, conversions: 8 },
    { source: 'Email Campaign', prospects: 32, conversions: 6 },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Prospect Trends */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <span>Prospect Performance Trends</span>
          </CardTitle>
          <CardDescription>
            Monthly progression of prospects, hot leads, and conversions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis 
                  dataKey="month" 
                  tickLine={false}
                  tick={{ fontSize: 10 }}
                  label={{ value: 'Month', position: 'insideBottom', offset: -15, style: { textAnchor: 'middle', fontSize: 11 } }}
                />
                <YAxis 
                  tickLine={false}
                  tick={{ fontSize: 10 }}
                  label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 11 } }}
                />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
                <Line 
                  type="monotone" 
                  dataKey="prospects" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Total Prospects"
                />
                <Line 
                  type="monotone" 
                  dataKey="hotLeads" 
                  stroke="#f97316" 
                  strokeWidth={2}
                  name="Hot Leads"
                />
                <Line 
                  type="monotone" 
                  dataKey="conversions" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Conversions"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Lead Score Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Lead Score Distribution</CardTitle>
          <CardDescription>
            Distribution of prospects across score ranges
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis 
                  dataKey="range" 
                  tickLine={false}
                  tick={{ fontSize: 10 }}
                  label={{ value: 'Score Range', position: 'insideBottom', offset: -15, style: { textAnchor: 'middle', fontSize: 11 } }}
                />
                <YAxis 
                  tickLine={false}
                  tick={{ fontSize: 10 }}
                  label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 11 } }}
                />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Conversion by Source */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion by Source</CardTitle>
          <CardDescription>
            Performance across different acquisition channels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conversionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis 
                  dataKey="source" 
                  tickLine={false}
                  tick={{ fontSize: 9 }}
                  height={60}
                  interval={0}
                />
                <YAxis 
                  tickLine={false}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Bar dataKey="prospects" fill="#60a5fa" name="Prospects" />
                <Bar dataKey="conversions" fill="#34d399" name="Conversions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
