export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getDataScope, buildProspectWhereClause } from '@/lib/data-isolation'
import { prisma } from '@/lib/db'
import { generateProspectReport, isAIConfigured } from '@/lib/ai'

/**
 * POST: Generate an AI report for a prospect
 * Body: { prospectId }
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const scope = await getDataScope()
        if (!scope) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (!isAIConfigured()) {
            return NextResponse.json(
                { error: 'AI not configured. Please add GEMINI_API_KEY to environment.' },
                { status: 500 }
            )
        }

        const body = await request.json()
        const { prospectId } = body

        if (!prospectId) {
            return NextResponse.json({ error: 'prospectId is required' }, { status: 400 })
        }

        // Get prospect with data isolation
        const prospect = await prisma.prospect.findFirst({
            where: {
                id: prospectId,
                ...buildProspectWhereClause(scope),
            },
        })

        if (!prospect) {
            return NextResponse.json({ error: 'Prospect not found' }, { status: 404 })
        }

        // Check for existing recent report (within last 24 hours)
        const existingReport = await prisma.prospectReport.findFirst({
            where: {
                prospectId: prospect.id,
                generatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            },
        })

        if (existingReport) {
            return NextResponse.json({
                report: existingReport,
                shareUrl: `/reports/${existingReport.shareToken}`,
                cached: true,
            })
        }

        // Generate new report with AI
        const aiReport = await generateProspectReport({
            companyName: prospect.companyName,
            city: prospect.city || 'Unknown',
            state: 'MN',
            businessType: prospect.businessType || 'Local Business',
            googleRating: prospect.googleRating,
            reviewCount: prospect.reviewCount,
            yelpRating: prospect.yelpRating,
            yelpReviewCount: prospect.yelpReviewCount,
            website: prospect.website,
            hasWebsite: !!prospect.website,
            employeeCount: prospect.employeeCount,
            categories: prospect.categories,
        })

        // Save report to database
        const report = await prisma.prospectReport.create({
            data: {
                prospectId: prospect.id,
                headline: aiReport.headline,
                strengths: aiReport.strengths,
                opportunities: aiReport.opportunities,
                competitorInsights: aiReport.competitorInsights,
                ctaText: aiReport.ctaText,
                estimatedValue: aiReport.estimatedValue,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            },
        })

        return NextResponse.json({
            report,
            shareUrl: `/reports/${report.shareToken}`,
            cached: false,
        })

    } catch (error) {
        console.error('Error generating report:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to generate report' },
            { status: 500 }
        )
    }
}

/**
 * GET: List reports for a prospect
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const scope = await getDataScope()
        if (!scope) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const prospectId = searchParams.get('prospectId')

        if (!prospectId) {
            return NextResponse.json({ error: 'prospectId is required' }, { status: 400 })
        }

        // Verify prospect ownership
        const prospect = await prisma.prospect.findFirst({
            where: {
                id: prospectId,
                ...buildProspectWhereClause(scope),
            },
        })

        if (!prospect) {
            return NextResponse.json({ error: 'Prospect not found' }, { status: 404 })
        }

        const reports = await prisma.prospectReport.findMany({
            where: { prospectId },
            orderBy: { generatedAt: 'desc' },
        })

        return NextResponse.json({ reports })

    } catch (error) {
        console.error('Error fetching reports:', error)
        return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
    }
}
