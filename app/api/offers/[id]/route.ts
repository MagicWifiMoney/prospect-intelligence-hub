export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getDataScope } from '@/lib/data-isolation'
import { apiErrorResponse, unauthorizedResponse, notFoundResponse, validationErrorResponse } from '@/lib/api-error'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/offers/[id]
 * Get a single offer template
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

    const offer = await prisma.offerTemplate.findFirst({
      where: {
        id,
        userId: scope.userId,
      },
      include: {
        segments: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    })

    if (!offer) {
      return notFoundResponse('Offer Template')
    }

    return NextResponse.json({ offer })
  } catch (error) {
    return apiErrorResponse(error, 'GET /api/offers/[id]', 'Failed to fetch offer template')
  }
}

/**
 * PATCH /api/offers/[id]
 * Update an offer template
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

    // Verify offer exists and belongs to user
    const existingOffer = await prisma.offerTemplate.findFirst({
      where: {
        id,
        userId: scope.userId,
      },
    })

    if (!existingOffer) {
      return notFoundResponse('Offer Template')
    }

    const body = await request.json()
    const { name, description, price, features, emailSubject, emailBody } = body

    // Build update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {}

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return validationErrorResponse('Offer name cannot be empty')
      }
      updateData.name = name.trim()
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null
    }

    if (price !== undefined) {
      updateData.price = price?.trim() || null
    }

    if (features !== undefined) {
      if (!Array.isArray(features) || !features.every((f) => typeof f === 'string')) {
        return validationErrorResponse('Features must be an array of strings')
      }
      updateData.features = features
    }

    if (emailSubject !== undefined) {
      if (typeof emailSubject !== 'string' || emailSubject.trim().length === 0) {
        return validationErrorResponse('Email subject cannot be empty')
      }
      updateData.emailSubject = emailSubject.trim()
    }

    if (emailBody !== undefined) {
      if (typeof emailBody !== 'string' || emailBody.trim().length === 0) {
        return validationErrorResponse('Email body cannot be empty')
      }
      updateData.emailBody = emailBody.trim()
    }

    const offer = await prisma.offerTemplate.update({
      where: { id },
      data: updateData,
      include: {
        segments: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    })

    return NextResponse.json({ offer })
  } catch (error) {
    return apiErrorResponse(error, 'PATCH /api/offers/[id]', 'Failed to update offer template')
  }
}

/**
 * DELETE /api/offers/[id]
 * Delete an offer template (unlinks from all segments first)
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

    // Verify offer exists and belongs to user
    const offer = await prisma.offerTemplate.findFirst({
      where: {
        id,
        userId: scope.userId,
      },
    })

    if (!offer) {
      return notFoundResponse('Offer Template')
    }

    // Unlink all segments from this offer first
    await prisma.icpSegment.updateMany({
      where: { offerTemplateId: id },
      data: { offerTemplateId: null },
    })

    // Delete the offer
    await prisma.offerTemplate.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return apiErrorResponse(error, 'DELETE /api/offers/[id]', 'Failed to delete offer template')
  }
}
