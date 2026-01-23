import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getDataScope } from '@/lib/data-isolation'
import { apiErrorResponse, unauthorizedResponse } from '@/lib/api-error'
import {
    scrapeYelp,
    getApifyRunStatus,
    getApifyDataset,
    importYelpResults,
    YelpResult
} from '@/lib/apify'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic';

/**
 * POST: Start a new Yelp scrape job
 * Body: { prospectId?: string, searchQuery?: string, location?: string, maxResults?: number }
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
        const { prospectId, searchQuery, location, maxResults = 10 } = body

        let finalSearchQuery = searchQuery
        let finalLocation = location

        // If prospectId is provided, pull details from DB
        if (prospectId) {
            const prospect = await prisma.prospect.findUnique({
                where: { id: prospectId },
                select: { companyName: true, city: true }
            })

            if (!prospect) {
                return NextResponse.json({ error: 'Prospect not found' }, { status: 404 })
            }

            finalSearchQuery = finalSearchQuery || prospect.companyName
            finalLocation = finalLocation || prospect.city
        }

        if (!finalSearchQuery || !finalLocation) {
            return NextResponse.json(
                { error: 'searchQuery and location are required' },
                { status: 400 }
            )
        }

        // Start the Yelp scrape
        const run = await scrapeYelp(finalSearchQuery, finalLocation, maxResults)

        // Create a system job to track this
        const job = await prisma.systemJob.create({
            data: {
                jobType: 'yelp_scrape',
                status: 'running',
                payload: JSON.stringify({
                    prospectId,
                    searchQuery: finalSearchQuery,
                    location: finalLocation,
                    maxResults,
                    apifyRunId: run.id,
                    userId: scope.userId,
                    organizationId: scope.organizationId,
                }),
                scheduledAt: new Date(),
                startedAt: new Date(),
            },
        })

        return NextResponse.json({
            success: true,
            jobId: job.id,
            apifyRunId: run.id,
            message: `Yelp search started for "${finalSearchQuery}" in ${finalLocation}`,
        })

    } catch (error) {
        return apiErrorResponse(error, 'POST /api/scrape/yelp', 'Failed to start Yelp scrape')
    }
}

/**
 * GET: Check status of a Yelp scrape job and process results if complete
 * Query: ?jobId=xxx
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return unauthorizedResponse()
        }

        const { searchParams } = new URL(request.url)
        const jobId = searchParams.get('jobId')

        if (!jobId) {
            return NextResponse.json({ error: 'jobId is required' }, { status: 400 })
        }

        // Get the job
        const job = await prisma.systemJob.findUnique({
            where: { id: jobId },
        })

        if (!job) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 })
        }

        const payload = JSON.parse(job.payload || '{}')

        // If already completed or failed, return the result
        if (job.status === 'completed' || job.status === 'failed') {
            return NextResponse.json({
                status: job.status,
                result: job.result ? JSON.parse(job.result) : null,
                error: job.error,
            })
        }

        // Check Apify run status
        const runStatus = await getApifyRunStatus(payload.apifyRunId)

        if (runStatus.status === 'SUCCEEDED') {
            // Get the results and import them
            const results = await getApifyDataset(runStatus.datasetId!) as YelpResult[]

            const importResult = await importYelpResults(results, {
                userId: payload.userId,
                organizationId: payload.organizationId,
            })

            // Update job as completed
            const resultSummary = {
                totalResults: results.length,
                matched: importResult.matched,
                created: importResult.created,
                errors: importResult.errors,
            }

            await prisma.systemJob.update({
                where: { id: jobId },
                data: {
                    status: 'completed',
                    result: JSON.stringify(resultSummary),
                    completedAt: new Date(),
                },
            })

            return NextResponse.json({
                status: 'completed',
                result: resultSummary,
            })

        } else if (runStatus.status === 'FAILED' || runStatus.status === 'ABORTED' || runStatus.status === 'TIMED-OUT') {
            // Update job as failed
            await prisma.systemJob.update({
                where: { id: jobId },
                data: {
                    status: 'failed',
                    error: `Apify run ${runStatus.status}`,
                    completedAt: new Date(),
                },
            })

            return NextResponse.json({
                status: 'failed',
                error: `Apify run ${runStatus.status}`,
            })

        } else {
            // Still running
            return NextResponse.json({
                status: 'running',
                apifyStatus: runStatus.status,
                message: 'Yelp scrape is still in progress',
            })
        }

    } catch (error) {
        return apiErrorResponse(error, 'GET /api/scrape/yelp', 'Failed to check Yelp job status')
    }
}

