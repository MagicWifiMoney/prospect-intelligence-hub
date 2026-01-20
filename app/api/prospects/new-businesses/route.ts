
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

    // First try to get from dedicated NewBusiness model
    const [newBusinesses, totalNewBusinesses] = await Promise.all([
      prisma.newBusiness.findMany({
        orderBy: { detectedAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          companyName: true,
          businessType: true,
          address: true,
          city: true,
          googleRating: true,
          reviewCount: true,
          firstSeenAt: true,
          isNewListing: true,
          isNewReviews: true,
          detectedAt: true,
        },
      }),
      prisma.newBusiness.count(),
    ])

    // If we have data in NewBusiness model, return it
    if (newBusinesses.length > 0) {
      return NextResponse.json({
        newBusinesses,
        total: totalNewBusinesses,
        page,
        totalPages: Math.ceil(totalNewBusinesses / limit),
        source: 'new_business_model',
      })
    }

    // Fallback: Get recently created prospects (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [recentProspects, totalRecent] = await Promise.all([
      prisma.prospect.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          companyName: true,
          businessType: true,
          address: true,
          city: true,
          googleRating: true,
          reviewCount: true,
          createdAt: true,
        },
      }),
      prisma.prospect.count({
        where: {
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
    ])

    // Transform prospect data to match NewBusiness format
    const transformedProspects = recentProspects.map(prospect => ({
      id: prospect.id,
      companyName: prospect.companyName,
      businessType: prospect.businessType,
      address: prospect.address,
      city: prospect.city,
      googleRating: prospect.googleRating,
      reviewCount: prospect.reviewCount,
      firstSeenAt: prospect.createdAt,
      isNewListing: true,
      isNewReviews: (prospect.reviewCount || 0) <= 5,
      detectedAt: prospect.createdAt,
    }))

    return NextResponse.json({
      newBusinesses: transformedProspects,
      total: totalRecent,
      page,
      totalPages: Math.ceil(totalRecent / limit),
      source: 'recent_prospects',
    })

  } catch (error) {
    return apiErrorResponse(error, 'GET /api/prospects/new-businesses', 'Failed to fetch new businesses')
  }
}
