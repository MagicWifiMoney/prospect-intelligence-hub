export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getDataScope, buildProspectWhereClause } from '@/lib/data-isolation'
import { apiErrorResponse, unauthorizedResponse, validationErrorResponse } from '@/lib/api-error'
import { validateSegmentRules, buildPrismaWhereFromRules, SegmentRules } from '@/lib/icp-rules'
import { Prisma } from '@/prisma/generated/client'

/**
 * GET /api/icp-segments
 * List all ICP segments for the current user with prospect counts
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return unauthorizedResponse()
    }

    const scope = await getDataScope()
    if (!scope) {
      return unauthorizedResponse()
    }

    // Get all segments for this user
    const segments = await prisma.icpSegment.findMany({
      where: { userId: scope.userId },
      include: {
        offerTemplate: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
        _count: {
          select: { prospects: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // For each segment, also get the count of prospects that match the rules
    // (not just those already assigned)
    const segmentsWithCounts = await Promise.all(
      segments.map(async (segment) => {
        const rules = segment.rules as SegmentRules
        const ruleWhere = buildPrismaWhereFromRules(rules)

        const matchingCount = await prisma.prospect.count({
          where: {
            ...buildProspectWhereClause(scope),
            ...ruleWhere,
          },
        })

        return {
          ...segment,
          assignedCount: segment._count.prospects,
          matchingCount,
        }
      })
    )

    return NextResponse.json({ segments: segmentsWithCounts })
  } catch (error) {
    return apiErrorResponse(error, 'GET /api/icp-segments', 'Failed to fetch ICP segments')
  }
}

/**
 * POST /api/icp-segments
 * Create a new ICP segment
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return unauthorizedResponse()
    }

    const scope = await getDataScope()
    if (!scope) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const { name, description, color, rules, offerTemplateId } = body

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return validationErrorResponse('Segment name is required')
    }

    // Validate rules
    if (!rules || !validateSegmentRules(rules)) {
      return validationErrorResponse('Invalid segment rules')
    }

    // Validate color format (hex)
    if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      return validationErrorResponse('Invalid color format. Use hex format like #06b6d4')
    }

    // If offerTemplateId provided, verify it exists and belongs to user
    if (offerTemplateId) {
      const offer = await prisma.offerTemplate.findFirst({
        where: {
          id: offerTemplateId,
          userId: scope.userId,
        },
      })
      if (!offer) {
        return validationErrorResponse('Offer template not found')
      }
    }

    // Create the segment
    const segment = await prisma.icpSegment.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        color: color || '#06b6d4',
        rules: rules as Prisma.InputJsonValue,
        offerTemplateId: offerTemplateId || null,
        userId: scope.userId,
      },
      include: {
        offerTemplate: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
      },
    })

    // Get matching prospect count
    const ruleWhere = buildPrismaWhereFromRules(rules)
    const matchingCount = await prisma.prospect.count({
      where: {
        ...buildProspectWhereClause(scope),
        ...ruleWhere,
      },
    })

    return NextResponse.json({
      segment: {
        ...segment,
        assignedCount: 0,
        matchingCount,
      },
    })
  } catch (error) {
    return apiErrorResponse(error, 'POST /api/icp-segments', 'Failed to create ICP segment')
  }
}
