import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { apiErrorResponse, unauthorizedResponse } from '@/lib/api-error'
import {
  scrapeWebsiteContacts,
  getApifyRunStatus,
  getApifyDataset,
  enrichProspectWithContacts,
  getProspectsNeedingEnrichment,
  ContactScraperResult,
} from '@/lib/apify'

export const dynamic = 'force-dynamic'

/**
 * POST /api/scrape/enrich-contacts
 * 
 * Enrich prospect(s) with contact info from their websites
 * 
 * Body options:
 * - { prospectId: string } - Enrich single prospect
 * - { prospectIds: string[] } - Enrich multiple prospects
 * - { bulk: true, limit?: number } - Auto-find prospects needing enrichment
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const { prospectId, prospectIds, bulk, limit = 20 } = body

    let prospectsToEnrich: Array<{ id: string; companyName: string; website: string }> = []

    if (bulk) {
      // Find prospects automatically
      prospectsToEnrich = await getProspectsNeedingEnrichment(limit)
    } else if (prospectId) {
      const prospect = await prisma.prospect.findUnique({
        where: { id: prospectId },
        select: { id: true, companyName: true, website: true },
      })
      if (prospect?.website) {
        prospectsToEnrich = [prospect as { id: string; companyName: string; website: string }]
      }
    } else if (prospectIds?.length) {
      const prospects = await prisma.prospect.findMany({
        where: { id: { in: prospectIds } },
        select: { id: true, companyName: true, website: true },
      })
      prospectsToEnrich = prospects.filter(p => p.website) as Array<{ id: string; companyName: string; website: string }>
    }

    if (prospectsToEnrich.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No prospects with websites found to enrich',
      }, { status: 400 })
    }

    // Extract URLs
    const urls = prospectsToEnrich.map(p => p.website)

    // Start Apify run
    const run = await scrapeWebsiteContacts(urls)

    // Create job record
    const job = await prisma.systemJob.create({
      data: {
        jobType: 'contact_enrichment',
        status: 'running',
        payload: JSON.stringify({
          apifyRunId: run.id,
          prospectIds: prospectsToEnrich.map(p => p.id),
          urls,
        }),
        scheduledAt: new Date(),
        startedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      jobId: job.id,
      apifyRunId: run.id,
      prospectsQueued: prospectsToEnrich.length,
      message: `Contact enrichment started for ${prospectsToEnrich.length} prospects`,
    })
  } catch (error) {
    return apiErrorResponse(error, 'POST /api/scrape/enrich-contacts', 'Failed to start enrichment')
  }
}

/**
 * GET /api/scrape/enrich-contacts?jobId=xxx
 * 
 * Check status of enrichment job and process results if complete
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return unauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      // Return prospects needing enrichment
      const needsEnrichment = await getProspectsNeedingEnrichment(100)
      return NextResponse.json({
        prospectsNeedingEnrichment: needsEnrichment.length,
        sample: needsEnrichment.slice(0, 10),
      })
    }

    // Check job status
    const job = await prisma.systemJob.findUnique({ where: { id: jobId } })
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const payload = JSON.parse(job.payload || '{}')
    const runStatus = await getApifyRunStatus(payload.apifyRunId)

    if (runStatus.status === 'SUCCEEDED' && job.status === 'running') {
      // Process results
      const results = await getApifyDataset(runStatus.datasetId!) as ContactScraperResult[]
      
      let enriched = 0
      let errors = 0

      // Map URLs to prospect IDs
      const urlToProspect = new Map<string, string>()
      const prospects = await prisma.prospect.findMany({
        where: { id: { in: payload.prospectIds } },
        select: { id: true, website: true },
      })
      prospects.forEach(p => {
        if (p.website) {
          // Normalize URL for matching
          const normalized = p.website.replace(/^https?:\/\//, '').replace(/\/$/, '')
          urlToProspect.set(normalized, p.id)
        }
      })

      for (const result of results) {
        try {
          const normalizedUrl = result.url.replace(/^https?:\/\//, '').replace(/\/$/, '')
          const prospectId = urlToProspect.get(normalizedUrl)
          
          if (prospectId && (result.emails?.length || result.linkedin || result.facebook)) {
            await enrichProspectWithContacts(prospectId, result)
            enriched++
          }
        } catch (e) {
          console.error('Error enriching prospect:', e)
          errors++
        }
      }

      // Update job
      await prisma.systemJob.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          result: JSON.stringify({ enriched, errors, total: results.length }),
          completedAt: new Date(),
        },
      })

      return NextResponse.json({
        status: 'completed',
        enriched,
        errors,
        total: results.length,
      })
    }

    return NextResponse.json({
      status: runStatus.status.toLowerCase(),
      jobStatus: job.status,
    })
  } catch (error) {
    return apiErrorResponse(error, 'GET /api/scrape/enrich-contacts', 'Failed to check status')
  }
}
