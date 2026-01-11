export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getDataScope } from '@/lib/data-isolation'
import {
    scrapeFacebookPages,
    getApifyRunStatus,
    getApifyDataset,
    importFacebookResults,
    FacebookPagesResult
} from '@/lib/apify'
import { prisma } from '@/lib/db'

/**
 * POST: Start a new Facebook Pages scrape job
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
        const { searchQuery, maxResults = 50 } = body

        if (!searchQuery) {
            return NextResponse.json({ error: 'searchQuery is required' }, { status: 400 })
        }

        const run = await scrapeFacebookPages(searchQuery, maxResults)

        const job = await prisma.systemJob.create({
            data: {
                jobType: 'facebook_scrape',
                status: 'running',
                payload: JSON.stringify({
                    searchQuery,
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
            message: `Facebook Pages scrape started for "${searchQuery}"`,
        })

    } catch (error) {
        console.error('Error starting Facebook scrape:', error)
        return NextResponse.json({ error: 'Failed to start Facebook scrape' }, { status: 500 })
    }
}

/**
 * GET: Check status of a Facebook scrape job
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
            return NextResponse.json({ error: 'jobId is required' }, { status: 400 })
        }

        const job = await prisma.systemJob.findUnique({ where: { id: jobId } })
        if (!job) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 })
        }

        const payload = JSON.parse(job.payload || '{}')

        if (job.status === 'completed' || job.status === 'failed') {
            return NextResponse.json({
                status: job.status,
                result: job.result ? JSON.parse(job.result) : null,
                error: job.error,
            })
        }

        const runStatus = await getApifyRunStatus(payload.apifyRunId)

        if (runStatus.status === 'SUCCEEDED') {
            const results = await getApifyDataset(runStatus.datasetId!) as FacebookPagesResult[]
            const importResult = await importFacebookResults(results, {
                userId: payload.userId,
                organizationId: payload.organizationId,
            })

            await prisma.systemJob.update({
                where: { id: jobId },
                data: {
                    status: 'completed',
                    result: JSON.stringify({ totalResults: results.length, ...importResult }),
                    completedAt: new Date(),
                },
            })

            return NextResponse.json({ status: 'completed', result: { totalResults: results.length, ...importResult } })

        } else if (runStatus.status === 'FAILED' || runStatus.status === 'ABORTED') {
            await prisma.systemJob.update({
                where: { id: jobId },
                data: { status: 'failed', error: `Apify run ${runStatus.status}`, completedAt: new Date() },
            })
            return NextResponse.json({ status: 'failed', error: `Apify run ${runStatus.status}` })

        } else {
            return NextResponse.json({ status: 'running', apifyStatus: runStatus.status })
        }

    } catch (error) {
        console.error('Error checking Facebook scrape status:', error)
        return NextResponse.json({ error: 'Failed to check status' }, { status: 500 })
    }
}
