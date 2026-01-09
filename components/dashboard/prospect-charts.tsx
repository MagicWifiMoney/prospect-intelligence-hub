
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'

interface ProspectChartsProps {
  scoreDistribution: Array<{
    leadScore: number | null
    _count: number
  }>
}

export function ProspectCharts({ scoreDistribution }: ProspectChartsProps) {
  // Process score distribution data for charts
  const scoreRanges = [
    { range: '0-20', min: 0, max: 20, count: 0, color: '#ef4444' },
    { range: '21-40', min: 21, max: 40, count: 0, color: '#f97316' },
    { range: '41-60', min: 41, max: 60, count: 0, color: '#eab308' },
    { range: '61-80', min: 61, max: 80, count: 0, color: '#22c55e' },
    { range: '81-100', min: 81, max: 100, count: 0, color: '#3b82f6' },
  ]

  // Aggregate scores into ranges
  scoreDistribution.forEach(({ leadScore, _count }) => {
    if (leadScore !== null) {
      const range = scoreRanges.find(r => leadScore >= r.min && leadScore <= r.max)
      if (range) {
        range.count += _count
      }
    }
  })

  const barData = scoreRanges.map(range => ({
    name: range.range,
    value: range.count,
    fill: range.color,
  }))

  const pieData = scoreRanges
    .filter(range => range.count > 0)
    .map(range => ({
      name: `${range.range} Score`,
      value: range.count,
      fill: range.color,
    }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Score Distribution Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Lead Score Distribution</CardTitle>
          <CardDescription>
            Distribution of prospects across different score ranges
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis 
                  dataKey="name" 
                  tickLine={false}
                  tick={{ fontSize: 10 }}
                  label={{ value: 'Score Range', position: 'insideBottom', offset: -15, style: { textAnchor: 'middle', fontSize: 11 } }}
                />
                <YAxis 
                  tickLine={false}
                  tick={{ fontSize: 10 }}
                  label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 11 } }}
                />
                <Tooltip 
                  contentStyle={{ fontSize: 11 }}
                  formatter={(value) => [`${value} prospects`, 'Count']}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Score Distribution Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Score Range Breakdown</CardTitle>
          <CardDescription>
            Percentage breakdown of prospect quality scores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ fontSize: 11 }}
                  formatter={(value) => [`${value} prospects`, 'Count']}
                />
                <Legend 
                  verticalAlign="top"
                  wrapperStyle={{ fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
