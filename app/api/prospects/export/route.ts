export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getDataScope, buildProspectWhereClause } from '@/lib/data-isolation'

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
    const search = searchParams.get('search')
    const businessType = searchParams.get('businessType')
    const city = searchParams.get('city')
    const isHotLead = searchParams.get('isHotLead')
    const hasAnomalies = searchParams.get('hasAnomalies')
    const minScore = searchParams.get('minScore')
    const maxScore = searchParams.get('maxScore')

    // Build where clause with data isolation (same logic as main prospects route)
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

    // Fetch all matching prospects (no pagination for export)
    const prospects = await prisma.prospect.findMany({
      where,
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
        anomaliesDetected: true,
        contactedAt: true,
        isConverted: true,
        notes: true,
        tags: true,
        ownerName: true,
        ownerEmail: true,
        ownerPhone: true,
        ownerTitle: true,
        companyLinkedIn: true,
        companyFacebook: true,
        companyInstagram: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // CSV column headers
    const headers = [
      'Company Name',
      'Business Type',
      'Address',
      'City',
      'Phone',
      'Email',
      'Website',
      'Google Business URL',
      'Google Rating',
      'Review Count',
      'Lead Score',
      'Sentiment Score',
      'Hot Lead',
      'Anomalies',
      'Contacted',
      'Converted',
      'Notes',
      'Tags',
      'Owner Name',
      'Owner Email',
      'Owner Phone',
      'Owner Title',
      'LinkedIn',
      'Facebook',
      'Instagram',
      'Created At',
      'Updated At',
    ]

    // Helper function to escape CSV values
    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) return ''
      const str = String(value)
      // If the value contains comma, quote, or newline, wrap in quotes and escape internal quotes
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    // Generate CSV rows
    const rows = prospects.map(prospect => [
      escapeCSV(prospect.companyName),
      escapeCSV(prospect.businessType),
      escapeCSV(prospect.address),
      escapeCSV(prospect.city),
      escapeCSV(prospect.phone),
      escapeCSV(prospect.email),
      escapeCSV(prospect.website),
      escapeCSV(prospect.gbpUrl),
      escapeCSV(prospect.googleRating),
      escapeCSV(prospect.reviewCount),
      escapeCSV(prospect.leadScore ? Math.round(prospect.leadScore) : ''),
      escapeCSV(prospect.sentimentScore),
      escapeCSV(prospect.isHotLead ? 'Yes' : 'No'),
      escapeCSV(prospect.anomaliesDetected),
      escapeCSV(prospect.contactedAt ? new Date(prospect.contactedAt).toLocaleDateString() : ''),
      escapeCSV(prospect.isConverted ? 'Yes' : 'No'),
      escapeCSV(prospect.notes),
      escapeCSV(prospect.tags),
      escapeCSV(prospect.ownerName),
      escapeCSV(prospect.ownerEmail),
      escapeCSV(prospect.ownerPhone),
      escapeCSV(prospect.ownerTitle),
      escapeCSV(prospect.companyLinkedIn),
      escapeCSV(prospect.companyFacebook),
      escapeCSV(prospect.companyInstagram),
      escapeCSV(prospect.createdAt ? new Date(prospect.createdAt).toLocaleDateString() : ''),
      escapeCSV(prospect.updatedAt ? new Date(prospect.updatedAt).toLocaleDateString() : ''),
    ].join(','))

    // Combine header and rows
    const csv = [headers.join(','), ...rows].join('\n')

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `prospects-export-${timestamp}.csv`

    // Return as downloadable file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })

  } catch (error) {
    console.error('Error exporting prospects:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
