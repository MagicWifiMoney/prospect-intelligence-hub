import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { startApifyRun, getApifyRunStatus, getApifyDataset, APIFY_ACTORS } from '@/lib/apify'

export const dynamic = 'force-dynamic'

interface ContactScraperResult {
  url: string
  emails?: string[]
  phones?: string[]
  socialLinks?: {
    facebook?: string
    twitter?: string
    instagram?: string
    linkedin?: string
    youtube?: string
  }
  contactPageUrl?: string
}

/**
 * POST - Enrich prospect contact details by scraping their website
 * Uses vdrmota/contact-info-scraper
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { prospectId, prospectIds, websites } = body

    // Get prospects to enrich
    let prospectsToEnrich: { id: string; website: string }[] = []

    if (prospectId) {
      // Single prospect
      const prospect = await prisma.prospect.findUnique({
        where: { id: prospectId },
        select: { id: true, website: true },
      })
      if (prospect?.website) {
        prospectsToEnrich.push({ id: prospect.id, website: prospect.website })
      }
    } else if (prospectIds?.length > 0) {
      // Multiple prospects by ID
      const prospects = await prisma.prospect.findMany({
        where: { id: { in: prospectIds }, website: { not: null } },
        select: { id: true, website: true },
      })
      prospectsToEnrich = prospects
        .filter((p) => p.website)
        .map((p) => ({ id: p.id, website: p.website! }))
    } else if (websites?.length > 0) {
      // Direct website URLs (for bulk enrichment)
      prospectsToEnrich = websites.map((url: string, i: number) => ({
        id: `temp_${i}`,
        website: url,
      }))
    } else {
      // Enrich all prospects missing email
      const prospects = await prisma.prospect.findMany({
        where: {
          website: { not: null },
          email: null,
        },
        select: { id: true, website: true },
        take: 50, // Limit batch size
      })
      prospectsToEnrich = prospects
        .filter((p) => p.website)
        .map((p) => ({ id: p.id, website: p.website! }))
    }

    if (prospectsToEnrich.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No prospects with websites found to enrich',
      })
    }

    // Prepare URLs for the scraper
    const urls = prospectsToEnrich.map((p) => p.website)

    // Start Apify run with contact-info-scraper
    const input = {
      startUrls: urls.map((url) => ({ url })),
      maxDepth: 2,
      maxPagesPerDomain: 10,
      scrapeEmails: true,
      scrapePhones: true,
      scrapeSocial: true,
    }

    const apifyRun = await startApifyRun(APIFY_ACTORS.CONTACT_SCRAPER, input)

    // Create a system job to track this
    await prisma.systemJob.create({
      data: {
        jobType: 'contact_enrichment',
        status: 'running',
        payload: JSON.stringify({
          apifyRunId: apifyRun.id,
          prospectMapping: prospectsToEnrich,
          websiteCount: urls.length,
        }),
        scheduledAt: new Date(),
        startedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      apifyRunId: apifyRun.id,
      datasetId: apifyRun.datasetId,
      status: apifyRun.status,
      websitesQueued: urls.length,
      message: `Started contact enrichment for ${urls.length} websites`,
    })
  } catch (error) {
    console.error('Error starting contact enrichment:', error)
    return NextResponse.json(
      { error: 'Failed to start contact enrichment', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * PUT - Import contact enrichment results and update prospects
 */
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { apifyRunId, datasetId } = body

    if (!apifyRunId && !datasetId) {
      return NextResponse.json(
        { error: 'apifyRunId or datasetId required' },
        { status: 400 }
      )
    }

    // Get dataset ID from run if not provided
    let finalDatasetId = datasetId
    if (!finalDatasetId && apifyRunId) {
      const runStatus = await getApifyRunStatus(apifyRunId)
      if (runStatus.status !== 'SUCCEEDED') {
        return NextResponse.json({
          success: false,
          status: runStatus.status,
          message: 'Run not yet completed',
        })
      }
      finalDatasetId = runStatus.datasetId
    }

    // Get results
    const results: ContactScraperResult[] = await getApifyDataset(finalDatasetId)

    // Update prospects with enriched data
    let updated = 0
    let notFound = 0

    for (const result of results) {
      if (!result.url) continue

      // Find prospect by website URL
      const prospect = await prisma.prospect.findFirst({
        where: {
          OR: [
            { website: { contains: new URL(result.url).hostname } },
            { website: result.url },
          ],
        },
      })

      if (!prospect) {
        notFound++
        continue
      }

      // Prepare update data
      const updateData: Record<string, any> = {
        enrichedAt: new Date(),
        updatedAt: new Date(),
      }

      // Add email if found and not already set
      if (result.emails?.length && !prospect.email) {
        updateData.email = result.emails[0]
      }

      // Add phone if found and not already set
      if (result.phones?.length && !prospect.phone) {
        updateData.phone = result.phones[0]
      }

      // Add social profiles
      if (result.socialLinks) {
        if (result.socialLinks.facebook && !prospect.companyFacebook) {
          updateData.companyFacebook = result.socialLinks.facebook
        }
        if (result.socialLinks.instagram && !prospect.companyInstagram) {
          updateData.companyInstagram = result.socialLinks.instagram
        }
        if (result.socialLinks.twitter && !prospect.companyTwitter) {
          updateData.companyTwitter = result.socialLinks.twitter
        }
        if (result.socialLinks.linkedin && !prospect.companyLinkedIn) {
          updateData.companyLinkedIn = result.socialLinks.linkedin
        }
      }

      // Track enrichment sources
      const existingSources = prospect.enrichmentSources || []
      if (!existingSources.includes('contact_scraper')) {
        updateData.enrichmentSources = [...existingSources, 'contact_scraper']
      }

      await prisma.prospect.update({
        where: { id: prospect.id },
        data: updateData,
      })

      updated++
    }

    return NextResponse.json({
      success: true,
      resultsProcessed: results.length,
      prospectsUpdated: updated,
      prospectsNotFound: notFound,
    })
  } catch (error) {
    console.error('Error importing contact enrichment:', error)
    return NextResponse.json(
      { error: 'Failed to import results', details: String(error) },
      { status: 500 }
    )
  }
}
