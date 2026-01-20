import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getDataScope, buildProspectWhereClause } from '@/lib/data-isolation'
import { apiErrorResponse, unauthorizedResponse, validationErrorResponse } from '@/lib/api-error'
import { paginationSchema } from '@/lib/validations/prospects'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return unauthorizedResponse()
    }

    // Get user's data scope for filtering
    const scope = await getDataScope()
    if (!scope) {
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

    // Build where clause with data isolation and goldmine criteria
    const baseWhere = buildProspectWhereClause(scope)
    const goldmineWhere = {
      ...baseWhere,
      OR: [
        { opportunityTags: { has: 'boring_goldmine' } },
        { opportunityScore: { gte: 70 } },
      ],
    }

    const [prospects, total] = await Promise.all([
      prisma.prospect.findMany({
        where: goldmineWhere,
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
      prisma.prospect.count({ where: goldmineWhere }),
    ])

    return NextResponse.json({
      prospects,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    return apiErrorResponse(error, 'GET /api/prospects/goldmines', 'Failed to fetch goldmine prospects')
  }
}
