
'use client'

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'

interface ProspectChartsProps {
  scoreDistribution: Array<{
    leadScore: number | null
    _count: number
  }>
}

export function ProspectCharts({ scoreDistribution }: ProspectChartsProps) {
  // Process score distribution data for charts with dark theme colors
  const scoreRanges = [
    { range: '0-20', min: 0, max: 20, count: 0, color: '#ef4444' },
    { range: '21-40', min: 21, max: 40, count: 0, color: '#f97316' },
    { range: '41-60', min: 41, max: 60, count: 0, color: '#eab308' },
    { range: '61-80', min: 61, max: 80, count: 0, color: '#22c55e' },
    { range: '81-100', min: 81, max: 100, count: 0, color: '#06b6d4' },
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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0d1424] border border-white/20 rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium">{label || payload[0].name}</p>
          <p className="text-cyan-400">{payload[0].value} prospects</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Score Distribution Bar Chart */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white font-display">Lead Score Distribution</h3>
          <p className="text-sm text-gray-500">
            Distribution of prospects across different score ranges
          </p>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#6b7280' }}
                label={{ value: 'Score Range', position: 'insideBottom', offset: -10, style: { textAnchor: 'middle', fontSize: 11, fill: '#6b7280' } }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#6b7280' }}
                label={{ value: 'Count', angle: -90, position: 'insideLeft', offset: 10, style: { textAnchor: 'middle', fontSize: 11, fill: '#6b7280' } }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Score Distribution Pie Chart */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white font-display">Score Range Breakdown</h3>
          <p className="text-sm text-gray-500">
            Percentage breakdown of prospect quality scores
          </p>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={50}
                dataKey="value"
                paddingAngle={2}
                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                wrapperStyle={{ fontSize: 11, color: '#9ca3af' }}
                formatter={(value) => <span style={{ color: '#9ca3af' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
