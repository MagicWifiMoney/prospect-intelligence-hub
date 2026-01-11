import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import {
  findDecisionMakers,
  getApifyRunStatus,
  getApifyDataset,
  enrichProspectWithDecisionMaker,
  LeadsFinderResult,
} from '@/lib/apify'

export const dynamic = 'force-dynamic'

/**
 * POST /api/scrape/find-decision-makers
 * 
 * Find decision makers (owners, CEOs, etc.) for prospect companies
 * Uses Apollo-style company → contact lookup
 * 
 * Body options:
 * - { prospectId: string } - Find for single prospect
 * - { prospectIds: string[] } - Find for multiple prospects
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { prospectId, prospectIds } = body

    let prospects: Array<{ id: string; companyName: string; website: string | null }> = []

    if (prospectId) {
      const prospect = await prisma.prospect.findUnique({
        where: { id: prospectId },
        select: { id: true, companyName: true, website: true },
      })
      if (prospect) prospects = [prospect]
    } else if (prospectIds?.length) {
      prospects = await prisma.prospect.findMany({
        where: { id: { in: prospectIds } },
        select: { id: true, companyName: true, website: true },
      })
    }

    if (prospects.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No prospects found',
      }, { status: 400 })
    }

    // For now, process one at a time (API limitation)
    // TODO: Batch if the actor supports it
    const prospect = prospects[0]
    const domain = prospect.website 
      ? prospect.website.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
      : undefined

    const run = await findDecisionMakers(prospect.companyName, domain)

    // Create job record
    const job = await prisma.systemJob.create({
      data: {
        jobType: 'decision_maker_lookup',
        status: 'running',
        payload: JSON.stringify({
          apifyRunId: run.id,
          prospectId: prospect.id,
          companyName: prospect.companyName,
          domain,
        }),
        scheduledAt: new Date(),
        startedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      jobId: job.id,
      apifyRunId: run.id,
      company: prospect.companyName,
      message: `Looking up decision makers for ${prospect.companyName}`,
    })
  } catch (error) {
    console.error('Error starting decision maker lookup:', error)
    return NextResponse.json(
      { error: 'Failed to start lookup', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * GET /api/scrape/find-decision-makers?jobId=xxx
 * 
 * Check status and process results
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      // Return prospects without owner info
      const needsLookup = await prisma.prospect.count({
        where: {
          ownerEmail: null,
          ownerName: null,
        },
      })
      return NextResponse.json({ prospectsNeedingLookup: needsLookup })
    }

    const job = await prisma.systemJob.findUnique({ where: { id: jobId } })
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const payload = JSON.parse(job.payload || '{}')
    const runStatus = await getApifyRunStatus(payload.apifyRunId)

    if (runStatus.status === 'SUCCEEDED' && job.status === 'running') {
      const results = await getApifyDataset(runStatus.datasetId!) as LeadsFinderResult[]
      
      let found = false
      const result = results[0]

      if (result?.contacts?.length && payload.prospectId) {
        await enrichProspectWithDecisionMaker(payload.prospectId, result)
        found = true
      }

      await prisma.systemJob.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          result: JSON.stringify({ 
            found, 
            contactsFound: result?.contacts?.length || 0,
            contacts: result?.contacts?.slice(0, 3), // Store first 3
          }),
          completedAt: new Date(),
        },
      })

      return NextResponse.json({
        status: 'completed',
        found,
        contacts: result?.contacts || [],
      })
    }

    if (runStatus.status === 'FAILED') {
      await prisma.systemJob.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          error: 'Apify run failed',
          completedAt: new Date(),
        },
      })
      return NextResponse.json({ status: 'failed' })
    }

    return NextResponse.json({
      status: runStatus.status.toLowerCase(),
      jobStatus: job.status,
    })
  } catch (error) {
    console.error('Error checking lookup status:', error)
    return NextResponse.json(
      { error: 'Failed to check status', details: String(error) },
      { status: 500 }
    )
  }
}
