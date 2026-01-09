
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    const [prospects, total] = await Promise.all([
      prisma.prospect.findMany({
        where: {
          OR: [
            { isHotLead: true },
            { leadScore: { gte: 75 } },
            { 
              AND: [
                { googleRating: { gte: 4.5 } },
                { reviewCount: { gte: 20 } },
                { leadScore: { gte: 60 } },
              ]
            }
          ]
        },
        skip,
        take: limit,
        orderBy: { leadScore: 'desc' },
        select: {
          id: true,
          companyName: true,
          businessType: true,
          city: true,
          phone: true,
          email: true,
          website: true,
          gbpUrl: true,
          googleRating: true,
          reviewCount: true,
          leadScore: true,
          sentimentScore: true,
          isHotLead: true,
          aiRecommendations: true,
          lastAnalyzed: true,
          contactedAt: true,
          isConverted: true,
        },
      }),
      prisma.prospect.count({
        where: {
          OR: [
            { isHotLead: true },
            { leadScore: { gte: 75 } },
            { 
              AND: [
                { googleRating: { gte: 4.5 } },
                { reviewCount: { gte: 20 } },
                { leadScore: { gte: 60 } },
              ]
            }
          ]
        },
      }),
    ])

    return NextResponse.json({
      prospects,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })

  } catch (error) {
    console.error('Error fetching hot leads:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
