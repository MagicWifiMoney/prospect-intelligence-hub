export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getDataScope, buildProspectWhereClause } from '@/lib/data-isolation'
import { apiErrorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api-error'
import { buildPrismaWhereFromRules, SegmentRules } from '@/lib/icp-rules'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * POST /api/icp-segments/[id]/apply
 * Apply segment rules to tag all matching prospects with this segment
 *
 * Options:
 * - clearOthers: If true, removes this segment from prospects that no longer match (default: false)
 */
export async function POST(request: NextRequest, context: RouteContext) {
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

    // Get the segment
    const segment = await prisma.icpSegment.findFirst({
      where: {
        id,
        userId: scope.userId,
      },
    })

    if (!segment) {
      return notFoundResponse('ICP Segment')
    }

    // Parse options from body
    let clearOthers = false
    try {
      const body = await request.json()
      clearOthers = body.clearOthers === true
    } catch {
      // No body or invalid JSON is fine, use defaults
    }

    const rules = segment.rules as SegmentRules
    const ruleWhere = buildPrismaWhereFromRules(rules)

    // If clearOthers is true, first unassign prospects that no longer match
    if (clearOthers) {
      // Get all prospects currently assigned to this segment
      const currentlyAssigned = await prisma.prospect.findMany({
        where: {
          icpSegmentId: id,
          ...buildProspectWhereClause(scope),
        },
        select: { id: true },
      })

      // Get prospects that match the rules
      const matchingProspects = await prisma.prospect.findMany({
        where: {
          ...buildProspectWhereClause(scope),
          ...ruleWhere,
        },
        select: { id: true },
      })

      const matchingIds = new Set(matchingProspects.map((p) => p.id))

      // Find prospects to unassign (currently assigned but don't match rules)
      const toUnassign = currentlyAssigned
        .filter((p) => !matchingIds.has(p.id))
        .map((p) => p.id)

      if (toUnassign.length > 0) {
        await prisma.prospect.updateMany({
          where: {
            id: { in: toUnassign },
          },
          data: { icpSegmentId: null },
        })
      }
    }

    // Assign all matching prospects to this segment
    const result = await prisma.prospect.updateMany({
      where: {
        ...buildProspectWhereClause(scope),
        ...ruleWhere,
      },
      data: { icpSegmentId: id },
    })

    // Get the updated count
    const assignedCount = await prisma.prospect.count({
      where: {
        icpSegmentId: id,
        ...buildProspectWhereClause(scope),
      },
    })

    return NextResponse.json({
      success: true,
      updated: result.count,
      assignedCount,
      message: `Applied segment rules to ${result.count} prospects`,
    })
  } catch (error) {
    return apiErrorResponse(error, 'POST /api/icp-segments/[id]/apply', 'Failed to apply segment rules')
  }
}
