import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'
import {
  detectTechStack,
  getApifyRunStatus,
  getApifyDataset,
  enrichProspectWithTechStack,
  BuiltWithResult,
} from '@/lib/apify'

export const dynamic = 'force-dynamic'

/**
 * POST /api/scrape/tech-stack
 * 
 * Detect tech stack for prospect websites using BuiltWith
 * Identifies: CMS, analytics, live chat, booking widgets, ecommerce, etc.
 * 
 * Body options:
 * - { prospectId: string } - Detect for single prospect
 * - { prospectIds: string[] } - Detect for multiple prospects
 * - { bulk: true, limit?: number } - Auto-find prospects needing tech detection
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { prospectId, prospectIds, bulk, limit = 20 } = body

    let prospects: Array<{ id: string; companyName: string; website: string }> = []

    if (bulk) {
      // Find prospects with websites but no tech stack data
      const rawProspects = await prisma.prospect.findMany({
        where: {
          website: { not: null },
          techStackRaw: { equals: Prisma.DbNull },
        },
        select: { id: true, companyName: true, website: true },
        take: limit,
        orderBy: { createdAt: 'desc' },
      })
      prospects = rawProspects.filter(p => p.website) as Array<{ id: string; companyName: string; website: string }>
    } else if (prospectId) {
      const prospect = await prisma.prospect.findUnique({
        where: { id: prospectId },
        select: { id: true, companyName: true, website: true },
      })
      if (prospect?.website) {
        prospects = [prospect as { id: string; companyName: string; website: string }]
      }
    } else if (prospectIds?.length) {
      const rawProspects = await prisma.prospect.findMany({
        where: { id: { in: prospectIds } },
        select: { id: true, companyName: true, website: true },
      })
      prospects = rawProspects.filter(p => p.website) as Array<{ id: string; companyName: string; website: string }>
    }

    if (prospects.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No prospects with websites found',
      }, { status: 400 })
    }

    // For BuiltWith, we'll process one at a time for now
    // Most actors charge per domain anyway
    const prospect = prospects[0]
    const domain = prospect.website.replace(/^https?:\/\//, '').replace(/\/.*$/, '')

    const run = await detectTechStack(domain)

    const job = await prisma.systemJob.create({
      data: {
        jobType: 'tech_stack_detection',
        status: 'running',
        payload: JSON.stringify({
          apifyRunId: run.id,
          prospectId: prospect.id,
          domain,
          remainingProspects: prospects.slice(1).map(p => p.id), // Queue rest for later
        }),
        scheduledAt: new Date(),
        startedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      jobId: job.id,
      apifyRunId: run.id,
      domain,
      company: prospect.companyName,
      queuedCount: prospects.length,
      message: `Tech stack detection started for ${domain}`,
    })
  } catch (error) {
    console.error('Error starting tech detection:', error)
    return NextResponse.json(
      { error: 'Failed to start tech detection', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * GET /api/scrape/tech-stack?jobId=xxx
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
      // Return stats on tech detection
      const [needsDetection, hasDetection, needsWebsite] = await Promise.all([
        prisma.prospect.count({
          where: { website: { not: null }, techStackRaw: { equals: Prisma.DbNull } },
        }),
        prisma.prospect.count({
          where: { NOT: { techStackRaw: { equals: Prisma.DbNull } } },
        }),
        prisma.prospect.count({
          where: { needsWebsite: true },
        }),
      ])

      return NextResponse.json({
        prospectsNeedingDetection: needsDetection,
        prospectsWithTechData: hasDetection,
        prospectsNeedingWebsite: needsWebsite,
      })
    }

    const job = await prisma.systemJob.findUnique({ where: { id: jobId } })
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const payload = JSON.parse(job.payload || '{}')
    const runStatus = await getApifyRunStatus(payload.apifyRunId)

    if (runStatus.status === 'SUCCEEDED' && job.status === 'running') {
      const results = await getApifyDataset(runStatus.datasetId!) as BuiltWithResult[]
      
      const result = results[0]
      let techSummary: any = null

      if (result && payload.prospectId) {
        await enrichProspectWithTechStack(payload.prospectId, result)
        
        techSummary = {
          domain: result.domain,
          cms: result.cms,
          technologiesCount: result.technologies?.length || 0,
          categories: [...new Set(result.technologies?.map(t => t.category) || [])],
        }
      }

      await prisma.systemJob.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          result: JSON.stringify(techSummary),
          completedAt: new Date(),
        },
      })

      return NextResponse.json({
        status: 'completed',
        techStack: techSummary,
        technologies: result?.technologies?.slice(0, 20) || [],
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
    console.error('Error checking tech detection status:', error)
    return NextResponse.json(
      { error: 'Failed to check status', details: String(error) },
      { status: 500 }
    )
  }
}
