
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getDataScope, buildProspectWhereClause, getProspectAssignment } from '@/lib/data-isolation'
import { apiErrorResponse, unauthorizedResponse, validationErrorResponse } from '@/lib/api-error'
import { prospectQuerySchema, prospectCreateSchema } from '@/lib/validations/prospects'

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

    // Validate query parameters with Zod
    const params = Object.fromEntries(searchParams.entries())
    const validated = prospectQuerySchema.safeParse(params)
    if (!validated.success) {
      return validationErrorResponse('Invalid query parameters')
    }

    const { page, limit, search, businessType, city, isHotLead, hasAnomalies, minScore, maxScore } = validated.data

    const skip = (page - 1) * limit

    // Build where clause with data isolation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      ...buildProspectWhereClause(scope),
    }

    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { businessType: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { website: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (businessType && businessType !== 'all') {
      where.businessType = { contains: businessType, mode: 'insensitive' }
    }

    if (city && city !== 'all') {
      where.city = city
    }

    if (isHotLead === 'true') {
      where.isHotLead = true
    }

    if (hasAnomalies === 'true') {
      where.anomaliesDetected = { not: null }
    }

    if (minScore !== undefined || maxScore !== undefined) {
      where.leadScore = {}
      if (minScore !== undefined) where.leadScore.gte = minScore
      if (maxScore !== undefined) where.leadScore.lte = maxScore
    }

    // Get prospects and total count
    const [prospects, total] = await Promise.all([
      prisma.prospect.findMany({
        where,
        skip,
        take: limit,
        orderBy: { leadScore: 'desc' },
        select: {
          id: true,
          companyName: true,
          businessType: true,
          address: true,
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
          lastAnalyzed: true,
          aiRecommendations: true,
          anomaliesDetected: true,
          contactedAt: true,
          isConverted: true,
          updatedAt: true,
          icpSegment: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
      }),
      prisma.prospect.count({ where }),
    ])

    return NextResponse.json({
      prospects,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })

  } catch (error) {
    return apiErrorResponse(error, 'GET /api/prospects', 'Failed to fetch prospects')
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return unauthorizedResponse()
    }

    // Get user's data scope for assignment
    const scope = await getDataScope()
    if (!scope) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const {
      companyName,
      businessType,
      address,
      city,
      phone,
      email,
      website,
      gbpUrl,
      placeId,
    } = body

    if (!companyName) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      )
    }

    // Check if prospect already exists within user's scope
    const existingProspect = placeId
      ? await prisma.prospect.findFirst({
          where: {
            placeId,
            ...buildProspectWhereClause(scope),
          }
        })
      : await prisma.prospect.findFirst({
          where: {
            companyName,
            city: city || undefined,
            ...buildProspectWhereClause(scope),
          },
        })

    if (existingProspect) {
      return NextResponse.json(
        { error: 'Prospect already exists' },
        { status: 400 }
      )
    }

    // Create prospect with data isolation assignment
    const prospect = await prisma.prospect.create({
      data: {
        companyName,
        businessType,
        address,
        city,
        phone,
        email,
        website,
        gbpUrl,
        placeId,
        dataSource: 'Manual Entry',
        ...getProspectAssignment(scope),
      },
    })

    // Trigger AI analysis in the background
    fetch(`${request.nextUrl.origin}/api/prospects/${prospect.id}/analyze`, {
      method: 'POST',
    }).catch(() => {}) // Fire and forget

    return NextResponse.json({ prospect })

  } catch (error) {
    return apiErrorResponse(error, 'POST /api/prospects', 'Failed to create prospect')
  }
}
