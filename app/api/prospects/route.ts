
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getDataScope, buildProspectWhereClause, getProspectAssignment } from '@/lib/data-isolation'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's data scope for filtering
    const scope = await getDataScope()
    if (!scope) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')
    const businessType = searchParams.get('businessType')
    const city = searchParams.get('city')
    const isHotLead = searchParams.get('isHotLead')
    const hasAnomalies = searchParams.get('hasAnomalies')
    const minScore = searchParams.get('minScore')
    const maxScore = searchParams.get('maxScore')

    const skip = (page - 1) * limit

    // Build where clause with data isolation
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

    if (minScore || maxScore) {
      where.leadScore = {}
      if (minScore) where.leadScore.gte = parseFloat(minScore)
      if (maxScore) where.leadScore.lte = parseFloat(maxScore)
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
    console.error('Error fetching prospects:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's data scope for assignment
    const scope = await getDataScope()
    if (!scope) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    console.error('Error creating prospect:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
