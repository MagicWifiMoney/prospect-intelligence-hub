export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getDataScope, getProspectAssignment } from '@/lib/data-isolation'
import {
    scrapeYelp,
    getApifyRunStatus,
    getApifyDataset,
    importYelpResults,
    YelpResult
} from '@/lib/apify'
import { prisma } from '@/lib/db'

/**
 * POST: Start a new Yelp scrape job
 * Body: { searchQuery: string, location: string, maxResults?: number }
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

        const body = await request.json()
        const { searchQuery, location, maxResults = 50 } = body

        if (!searchQuery || !location) {
            return NextResponse.json(
                { error: 'searchQuery and location are required' },
                { status: 400 }
            )
        }

        // Start the Yelp scrape
        const run = await scrapeYelp(searchQuery, location, maxResults)

        // Create a system job to track this
        const job = await prisma.systemJob.create({
            data: {
                jobType: 'yelp_scrape',
                status: 'running',
                payload: JSON.stringify({
                    searchQuery,
                    location,
                    maxResults,
                    apifyRunId: run.id,
                    datasetId: run.datasetId,
                    userId: scope.userId,
                    organizationId: scope.organizationId,
                }),
                startedAt: new Date(),
            },
        })

        return NextResponse.json({
            success: true,
            jobId: job.id,
            apifyRunId: run.id,
            status: run.status,
            message: `Yelp scrape started for "${searchQuery}" in ${location}`,
        })

    } catch (error) {
        console.error('Error starting Yelp scrape:', error)
        return NextResponse.json(
            { error: 'Failed to start Yelp scrape' },
            { status: 500 }
        )
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
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const jobId = searchParams.get('jobId')

        if (!jobId) {
            return NextResponse.json(
                { error: 'jobId is required' },
                { status: 400 }
            )
        }

        // Get the job
        const job = await prisma.systemJob.findUnique({
            where: { id: jobId },
        })

        if (!job) {
            return NextResponse.json(
                { error: 'Job not found' },
                { status: 404 }
            )
        }

        const payload = JSON.parse(job.payload || '{}')

        // If already completed, return the result
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
            await prisma.systemJob.update({
                where: { id: jobId },
                data: {
                    status: 'completed',
                    result: JSON.stringify({
                        totalResults: results.length,
                        matched: importResult.matched,
                        created: importResult.created,
                        errors: importResult.errors,
                    }),
                    completedAt: new Date(),
                },
            })

            return NextResponse.json({
                status: 'completed',
                result: {
                    totalResults: results.length,
                    matched: importResult.matched,
                    created: importResult.created,
                    errors: importResult.errors,
                },
            })

        } else if (runStatus.status === 'FAILED' || runStatus.status === 'ABORTED') {
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
        console.error('Error checking Yelp scrape status:', error)
        return NextResponse.json(
            { error: 'Failed to check status' },
            { status: 500 }
        )
    }
}
