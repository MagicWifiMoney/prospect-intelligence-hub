import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import {
  getApifyRunStatus,
  getApifyDataset,
  importGoogleMapsResults,
  updateScrapeJob,
  getRecentScrapeJobs,
} from '@/lib/apify'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const runId = searchParams.get('runId')
    const jobId = searchParams.get('jobId')

    if (runId) {
      // Check specific run status
      const status = await getApifyRunStatus(runId)
      return NextResponse.json(status)
    }

    if (jobId) {
      // Get specific job
      const job = await prisma.systemJob.findUnique({ where: { id: jobId } })
      return NextResponse.json(job)
    }

    // Return recent jobs
    const recentJobs = await getRecentScrapeJobs(20)
    return NextResponse.json({ jobs: recentJobs })
  } catch (error) {
    console.error('Error getting status:', error)
    return NextResponse.json({ error: 'Failed to get status' }, { status: 500 })
  }
}

// Import results from a completed run
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { runId, jobId, datasetId } = await request.json()

    // Check if run is complete
    const status = await getApifyRunStatus(runId)

    if (status.status !== 'SUCCEEDED') {
      return NextResponse.json({
        success: false,
        status: status.status,
        message: `Run is ${status.status}. Wait for completion.`,
      })
    }

    // Get and import results
    const datasetToUse = datasetId || status.datasetId
    if (!datasetToUse) {
      return NextResponse.json({ error: 'No dataset ID available' }, { status: 400 })
    }

    const results = await getApifyDataset(datasetToUse)
    const importResult = await importGoogleMapsResults(results)

    // Update job status
    if (jobId) {
      await updateScrapeJob(jobId, 'completed', importResult)
    }

    return NextResponse.json({
      success: true,
      ...importResult,
      totalResults: results.length,
      message: `Imported ${importResult.imported} new prospects. ${importResult.duplicates} duplicates updated.`,
    })
  } catch (error) {
    console.error('Error importing results:', error)
    return NextResponse.json(
      { error: 'Failed to import results', details: String(error) },
      { status: 500 }
    )
  }
}
