
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { apiErrorResponse, unauthorizedResponse, validationErrorResponse } from '@/lib/api-error'
import { paginationSchema } from '@/lib/validations/prospects'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return unauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)

    // Validate pagination params
    const params = Object.fromEntries(searchParams.entries())
    const validated = paginationSchema.safeParse(params)
    if (!validated.success) {
      return validationErrorResponse('Invalid pagination parameters')
    }

    const { page, limit } = validated.data
    const skip = (page - 1) * limit

    // Build where clause without data isolation - show all hot leads like dashboard
    const hotLeadWhere = {
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
    }

    const [prospects, total] = await Promise.all([
      prisma.prospect.findMany({
        where: hotLeadWhere,
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
      prisma.prospect.count({ where: hotLeadWhere }),
    ])

    return NextResponse.json({
      prospects,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })

  } catch (error) {
    return apiErrorResponse(error, 'GET /api/prospects/hot-leads', 'Failed to fetch hot leads')
  }
}
