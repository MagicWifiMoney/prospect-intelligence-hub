import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Goldmines = prospects with 'boring_goldmine' tag OR high opportunity score
    const [prospects, total] = await Promise.all([
      prisma.prospect.findMany({
        where: {
          OR: [
            { opportunityTags: { has: 'boring_goldmine' } },
            { opportunityScore: { gte: 70 } },
          ],
        },
        orderBy: { opportunityScore: 'desc' },
        skip,
        take: limit,
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
          opportunityScore: true,
          highTicketScore: true,
          opportunityTags: true,
          scoringFactors: true,
          contactedAt: true,
          isConverted: true,
          facebook: true,
          instagram: true,
          linkedin: true,
        },
      }),
      prisma.prospect.count({
        where: {
          OR: [
            { opportunityTags: { has: 'boring_goldmine' } },
            { opportunityScore: { gte: 70 } },
          ],
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
    console.error('Error fetching goldmines:', error)
    return NextResponse.json(
      { error: 'Failed to fetch goldmine prospects' },
      { status: 500 }
    )
  }
}
