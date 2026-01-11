import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { startApifyRun, getApifyRunStatus, getApifyDataset, APIFY_ACTORS } from '@/lib/apify'

export const dynamic = 'force-dynamic'

interface LeadsFinderResult {
  companyName?: string
  companyDomain?: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  contactTitle?: string
  contactLinkedIn?: string
  confidence?: number
}

/**
 * POST - Find decision makers (owners/contacts) for prospects
 * Uses code_crafter/leads-finder (Apollo-style lookup)
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { prospectId, prospectIds, companies } = body

    // Build list of companies to look up
    let companiesToLookup: { id: string; name: string; domain?: string }[] = []

    if (prospectId) {
      const prospect = await prisma.prospect.findUnique({
        where: { id: prospectId },
        select: { id: true, companyName: true, website: true },
      })
      if (prospect) {
        companiesToLookup.push({
          id: prospect.id,
          name: prospect.companyName,
          domain: prospect.website ? extractDomain(prospect.website) : undefined,
        })
      }
    } else if (prospectIds?.length > 0) {
      const prospects = await prisma.prospect.findMany({
        where: { id: { in: prospectIds } },
        select: { id: true, companyName: true, website: true },
      })
      companiesToLookup = prospects.map((p) => ({
        id: p.id,
        name: p.companyName,
        domain: p.website ? extractDomain(p.website) : undefined,
      }))
    } else if (companies?.length > 0) {
      companiesToLookup = companies.map((c: any, i: number) => ({
        id: c.id || `temp_${i}`,
        name: c.name,
        domain: c.domain,
      }))
    } else {
      // Find prospects missing owner info
      const prospects = await prisma.prospect.findMany({
        where: {
          ownerEmail: null,
          website: { not: null },
        },
        select: { id: true, companyName: true, website: true },
        take: 25, // Limit batch size - this actor can be pricey
      })
      companiesToLookup = prospects.map((p) => ({
        id: p.id,
        name: p.companyName,
        domain: p.website ? extractDomain(p.website) : undefined,
      }))
    }

    if (companiesToLookup.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No companies found to look up',
      })
    }

    // Prepare input for leads-finder
    const input = {
      companies: companiesToLookup.map((c) => ({
        name: c.name,
        domain: c.domain,
      })),
      findEmails: true,
      findPhones: true,
      findLinkedIn: true,
      roles: ['owner', 'founder', 'ceo', 'president', 'manager', 'director'],
    }

    const apifyRun = await startApifyRun(APIFY_ACTORS.LEADS_FINDER, input)

    // Create tracking job
    await prisma.systemJob.create({
      data: {
        jobType: 'leads_finder',
        status: 'running',
        payload: JSON.stringify({
          apifyRunId: apifyRun.id,
          companyMapping: companiesToLookup,
          companyCount: companiesToLookup.length,
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
      companiesQueued: companiesToLookup.length,
      message: `Started decision maker lookup for ${companiesToLookup.length} companies`,
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
 * PUT - Import decision maker results and update prospects
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
    const results: LeadsFinderResult[] = await getApifyDataset(finalDatasetId)

    let updated = 0
    let notFound = 0

    for (const result of results) {
      if (!result.companyName && !result.companyDomain) continue

      // Find matching prospect
      let prospect = null
      if (result.companyDomain) {
        prospect = await prisma.prospect.findFirst({
          where: {
            website: { contains: result.companyDomain },
          },
        })
      }
      if (!prospect && result.companyName) {
        prospect = await prisma.prospect.findFirst({
          where: {
            companyName: { equals: result.companyName, mode: 'insensitive' },
          },
        })
      }

      if (!prospect) {
        notFound++
        continue
      }

      // Update with decision maker info
      const updateData: Record<string, any> = {
        enrichedAt: new Date(),
        updatedAt: new Date(),
      }

      if (result.contactName && !prospect.ownerName) {
        updateData.ownerName = result.contactName
      }
      if (result.contactEmail && !prospect.ownerEmail) {
        updateData.ownerEmail = result.contactEmail
      }
      if (result.contactPhone && !prospect.ownerPhone) {
        updateData.ownerPhone = result.contactPhone
      }
      if (result.contactLinkedIn && !prospect.ownerLinkedIn) {
        updateData.ownerLinkedIn = result.contactLinkedIn
      }

      // Track enrichment sources
      const existingSources = prospect.enrichmentSources || []
      if (!existingSources.includes('leads_finder')) {
        updateData.enrichmentSources = [...existingSources, 'leads_finder']
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
    console.error('Error importing decision maker results:', error)
    return NextResponse.json(
      { error: 'Failed to import results', details: String(error) },
      { status: 500 }
    )
  }
}

function extractDomain(url: string): string | undefined {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`)
    return parsed.hostname.replace('www.', '')
  } catch {
    return undefined
  }
}
