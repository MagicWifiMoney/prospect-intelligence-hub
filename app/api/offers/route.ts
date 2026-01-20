export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getDataScope } from '@/lib/data-isolation'
import { apiErrorResponse, unauthorizedResponse, validationErrorResponse } from '@/lib/api-error'

/**
 * GET /api/offers
 * List all offer templates for the current user
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

    const offers = await prisma.offerTemplate.findMany({
      where: { userId: scope.userId },
      include: {
        _count: {
          select: { segments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      offers: offers.map((offer) => ({
        ...offer,
        segmentCount: offer._count.segments,
      })),
    })
  } catch (error) {
    return apiErrorResponse(error, 'GET /api/offers', 'Failed to fetch offer templates')
  }
}

/**
 * POST /api/offers
 * Create a new offer template
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
    const { name, description, price, features, emailSubject, emailBody } = body

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return validationErrorResponse('Offer name is required')
    }

    if (!emailSubject || typeof emailSubject !== 'string' || emailSubject.trim().length === 0) {
      return validationErrorResponse('Email subject is required')
    }

    if (!emailBody || typeof emailBody !== 'string' || emailBody.trim().length === 0) {
      return validationErrorResponse('Email body is required')
    }

    // Validate features is an array of strings
    if (features !== undefined) {
      if (!Array.isArray(features) || !features.every((f) => typeof f === 'string')) {
        return validationErrorResponse('Features must be an array of strings')
      }
    }

    const offer = await prisma.offerTemplate.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        price: price?.trim() || null,
        features: features || [],
        emailSubject: emailSubject.trim(),
        emailBody: emailBody.trim(),
        userId: scope.userId,
      },
    })

    return NextResponse.json({ offer })
  } catch (error) {
    return apiErrorResponse(error, 'POST /api/offers', 'Failed to create offer template')
  }
}
