export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getDataScope, buildProspectWhereClause } from '@/lib/data-isolation'
import { apiErrorResponse, unauthorizedResponse, notFoundResponse, validationErrorResponse } from '@/lib/api-error'
import { validateSegmentRules, buildPrismaWhereFromRules, SegmentRules } from '@/lib/icp-rules'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/icp-segments/[id]
 * Get a single ICP segment with details
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return unauthorizedResponse()
    }

    const scope = await getDataScope()
    if (!scope) {
      return unauthorizedResponse()
    }

    const { id } = await context.params

    const segment = await prisma.icpSegment.findFirst({
      where: {
        id,
        userId: scope.userId,
      },
      include: {
        offerTemplate: true,
        _count: {
          select: { prospects: true },
        },
      },
    })

    if (!segment) {
      return notFoundResponse('ICP Segment')
    }

    // Get matching prospect count
    const rules = segment.rules as SegmentRules
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
        assignedCount: segment._count.prospects,
        matchingCount,
      },
    })
  } catch (error) {
    return apiErrorResponse(error, 'GET /api/icp-segments/[id]', 'Failed to fetch ICP segment')
  }
}

/**
 * PATCH /api/icp-segments/[id]
 * Update an ICP segment
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return unauthorizedResponse()
    }

    const scope = await getDataScope()
    if (!scope) {
      return unauthorizedResponse()
    }

    const { id } = await context.params

    // Verify segment exists and belongs to user
    const existingSegment = await prisma.icpSegment.findFirst({
      where: {
        id,
        userId: scope.userId,
      },
    })

    if (!existingSegment) {
      return notFoundResponse('ICP Segment')
    }

    const body = await request.json()
    const { name, description, color, rules, offerTemplateId } = body

    // Build update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {}

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return validationErrorResponse('Segment name cannot be empty')
      }
      updateData.name = name.trim()
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null
    }

    if (color !== undefined) {
      if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
        return validationErrorResponse('Invalid color format. Use hex format like #06b6d4')
      }
      updateData.color = color
    }

    if (rules !== undefined) {
      if (!validateSegmentRules(rules)) {
        return validationErrorResponse('Invalid segment rules')
      }
      updateData.rules = rules
    }

    if (offerTemplateId !== undefined) {
      if (offerTemplateId === null) {
        updateData.offerTemplateId = null
      } else {
        // Verify offer exists and belongs to user
        const offer = await prisma.offerTemplate.findFirst({
          where: {
            id: offerTemplateId,
            userId: scope.userId,
          },
        })
        if (!offer) {
          return validationErrorResponse('Offer template not found')
        }
        updateData.offerTemplateId = offerTemplateId
      }
    }

    // Update the segment
    const segment = await prisma.icpSegment.update({
      where: { id },
      data: updateData,
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
    })

    // Get matching prospect count with updated rules
    const finalRules = (rules || existingSegment.rules) as SegmentRules
    const ruleWhere = buildPrismaWhereFromRules(finalRules)
    const matchingCount = await prisma.prospect.count({
      where: {
        ...buildProspectWhereClause(scope),
        ...ruleWhere,
      },
    })

    return NextResponse.json({
      segment: {
        ...segment,
        assignedCount: segment._count.prospects,
        matchingCount,
      },
    })
  } catch (error) {
    return apiErrorResponse(error, 'PATCH /api/icp-segments/[id]', 'Failed to update ICP segment')
  }
}

/**
 * DELETE /api/icp-segments/[id]
 * Delete an ICP segment (unassigns all prospects first)
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return unauthorizedResponse()
    }

    const scope = await getDataScope()
    if (!scope) {
      return unauthorizedResponse()
    }

    const { id } = await context.params

    // Verify segment exists and belongs to user
    const segment = await prisma.icpSegment.findFirst({
      where: {
        id,
        userId: scope.userId,
      },
    })

    if (!segment) {
      return notFoundResponse('ICP Segment')
    }

    // Unassign all prospects from this segment first
    await prisma.prospect.updateMany({
      where: { icpSegmentId: id },
      data: { icpSegmentId: null },
    })

    // Delete the segment
    await prisma.icpSegment.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return apiErrorResponse(error, 'DELETE /api/icp-segments/[id]', 'Failed to delete ICP segment')
  }
}
