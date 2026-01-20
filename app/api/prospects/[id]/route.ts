
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getDataScope, buildProspectWhereClause } from '@/lib/data-isolation'
import { apiErrorResponse, notFoundResponse, unauthorizedResponse } from '@/lib/api-error'
import { prospectUpdateSchema } from '@/lib/validations/prospects'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Fetch prospect with data isolation
    const prospect = await prisma.prospect.findFirst({
      where: {
        id: params.id,
        ...buildProspectWhereClause(scope),
      },
      include: {
        reviews: {
          orderBy: { publishedAt: 'desc' },
          take: 20
        },
        historicalData: {
          orderBy: { recordedAt: 'desc' },
          take: 10
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 50
        }
      }
    })

    if (!prospect) {
      return notFoundResponse('Prospect')
    }

    return NextResponse.json({ prospect })
  } catch (error) {
    return apiErrorResponse(error, 'GET /api/prospects/[id]', 'Failed to fetch prospect')
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verify prospect belongs to user's scope before updating
    const existingProspect = await prisma.prospect.findFirst({
      where: {
        id: params.id,
        ...buildProspectWhereClause(scope),
      },
      select: { id: true },
    })

    if (!existingProspect) {
      return notFoundResponse('Prospect')
    }

    const body = await req.json()

    // Validate update payload
    const validated = prospectUpdateSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json({ error: 'Invalid update data' }, { status: 400 })
    }

    const { notes, tags, contactedAt, isConverted } = validated.data

    const updateData: Record<string, unknown> = {}
    if (notes !== undefined) updateData.notes = notes
    if (tags !== undefined) updateData.tags = tags
    if (contactedAt !== undefined) updateData.contactedAt = contactedAt ? new Date(contactedAt) : null
    if (isConverted !== undefined) updateData.isConverted = isConverted

    const prospect = await prisma.prospect.update({
      where: { id: params.id },
      data: updateData
    })

    // Log activity
    if (notes) {
      await prisma.prospectActivity.create({
        data: {
          prospectId: params.id,
          activityType: 'note',
          content: notes,
          createdBy: session.user?.email || 'system'
        }
      })
    }

    if (tags) {
      await prisma.prospectActivity.create({
        data: {
          prospectId: params.id,
          activityType: 'tag_added',
          content: `Tags updated: ${tags}`,
          createdBy: session.user?.email || 'system'
        }
      })
    }

    if (contactedAt) {
      await prisma.prospectActivity.create({
        data: {
          prospectId: params.id,
          activityType: 'status_change',
          content: 'Marked as contacted',
          createdBy: session.user?.email || 'system'
        }
      })
    }

    return NextResponse.json({ success: true, prospect })
  } catch (error) {
    return apiErrorResponse(error, 'PATCH /api/prospects/[id]', 'Failed to update prospect')
  }
}
