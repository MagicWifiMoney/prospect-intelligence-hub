
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Helper functions to transform database format to frontend format
function mapCategory(category: string): 'service_business' | 'general_market' | 'industry_news' {
  const lowerCategory = category.toLowerCase()
  if (lowerCategory.includes('service') || lowerCategory.includes('contractor')) {
    return 'service_business'
  } else if (lowerCategory.includes('news') || lowerCategory.includes('industry')) {
    return 'industry_news'
  } else {
    return 'general_market'
  }
}

function determineImpact(relevance: number): 'high' | 'medium' | 'low' {
  if (relevance >= 0.7) return 'high'
  if (relevance >= 0.4) return 'medium'
  return 'low'
}

function mapTrendDirection(trend: string): 'up' | 'down' | 'stable' {
  const lowerTrend = trend.toLowerCase()
  if (lowerTrend.includes('grow') || lowerTrend.includes('rising') || lowerTrend.includes('emerg')) {
    return 'up'
  } else if (lowerTrend.includes('declin') || lowerTrend.includes('falling')) {
    return 'down'
  } else {
    return 'stable'
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: any = {}
    if (category && category !== 'all') {
      where.category = category
    }

    const dbTrends = await prisma.marketTrend.findMany({
      where,
      take: limit,
      orderBy: { extractedAt: 'desc' },
    })

    // Transform database format to frontend format
    const trends = dbTrends.map(trend => ({
      id: trend.id,
      title: trend.title,
      category: mapCategory(trend.category),
      summary: trend.content,
      impact: determineImpact(trend.relevance || 0.5),
      trend_direction: mapTrendDirection(trend.trend || 'stable'),
      source: trend.source || undefined,
      date: trend.extractedAt.toISOString(),
    }))

    return NextResponse.json({ trends })

  } catch (error) {
    console.error('Error fetching trends:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Generate market trends using AI
    const trendPrompt = `
    Generate 5 current market trends for service-based businesses (contractors, painters, home services) and general business trends suitable for a marketing agency newsletter.

    Focus on:
    1. Digital marketing trends
    2. Service industry innovations  
    3. Customer behavior changes
    4. Technology adoption
    5. Market opportunities

    Respond in JSON format:
    {
      "trends": [
        {
          "category": "Service Business" | "Marketing" | "Technology" | "Customer Behavior",
          "title": "Trend title",
          "content": "Detailed trend description and implications",
          "trend": "Growing" | "Declining" | "Emerging" | "Stable",
          "relevance": 0.0-1.0
        }
      ]
    }
    `

    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [{ role: 'user', content: trendPrompt }],
        response_format: { type: "json_object" },
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to generate trends')
    }

    const data = await response.json()
    const trendsResult = JSON.parse(data.choices[0].message.content)

    // Save trends to database and transform for frontend
    const savedTrends = []
    for (const trend of trendsResult.trends) {
      const dbTrend = await prisma.marketTrend.create({
        data: {
          category: trend.category,
          title: trend.title,
          content: trend.content,
          trend: trend.trend,
          relevance: trend.relevance || 0.5,
          source: 'AI Generated',
          publishedAt: new Date(),
        },
      })
      
      // Transform to frontend format
      savedTrends.push({
        id: dbTrend.id,
        title: dbTrend.title,
        category: mapCategory(dbTrend.category),
        summary: dbTrend.content,
        impact: determineImpact(dbTrend.relevance || 0.5),
        trend_direction: mapTrendDirection(dbTrend.trend || 'stable'),
        source: dbTrend.source || undefined,
        date: dbTrend.extractedAt.toISOString(),
      })
    }

    return NextResponse.json({ 
      success: true,
      trends: savedTrends
    })

  } catch (error) {
    console.error('Error generating trends:', error)
    return NextResponse.json(
      { error: 'Failed to generate trends' },
      { status: 500 }
    )
  }
}
