import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { startApifyRun, getApifyRunStatus, getApifyDataset, APIFY_ACTORS } from '@/lib/apify'

export const dynamic = 'force-dynamic'

interface BuiltWithResult {
  url: string
  technologies?: Array<{
    name: string
    category: string
    description?: string
  }>
  cms?: string[]
  analytics?: string[]
  advertising?: string[]
  hosting?: string[]
  javascript?: string[]
  widgets?: string[]
  ecommerce?: string[]
}

// Known CMS systems to detect
const CMS_SYSTEMS = [
  'wordpress', 'wix', 'squarespace', 'shopify', 'webflow', 'drupal', 
  'joomla', 'ghost', 'weebly', 'godaddy', 'bigcommerce', 'magento',
  'contentful', 'strapi', 'sanity', 'prismic'
]

// Known analytics platforms
const ANALYTICS_PLATFORMS = [
  'google analytics', 'google tag manager', 'facebook pixel', 'hotjar',
  'mixpanel', 'segment', 'amplitude', 'heap', 'plausible', 'fathom'
]

// Known live chat systems
const LIVE_CHAT_SYSTEMS = [
  'intercom', 'drift', 'zendesk', 'freshdesk', 'crisp', 'tidio',
  'hubspot', 'livechat', 'tawk', 'olark', 'chatra'
]

/**
 * POST - Detect tech stack for prospect websites
 * Uses canadesk/builtwith
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { prospectId, prospectIds, websites } = body

    // Get websites to analyze
    let websitesToAnalyze: { id: string; website: string }[] = []

    if (prospectId) {
      const prospect = await prisma.prospect.findUnique({
        where: { id: prospectId },
        select: { id: true, website: true },
      })
      if (prospect?.website) {
        websitesToAnalyze.push({ id: prospect.id, website: prospect.website })
      }
    } else if (prospectIds?.length > 0) {
      const prospects = await prisma.prospect.findMany({
        where: { id: { in: prospectIds }, website: { not: null } },
        select: { id: true, website: true },
      })
      websitesToAnalyze = prospects
        .filter((p) => p.website)
        .map((p) => ({ id: p.id, website: p.website! }))
    } else if (websites?.length > 0) {
      websitesToAnalyze = websites.map((url: string, i: number) => ({
        id: `temp_${i}`,
        website: url,
      }))
    } else {
      // Analyze prospects that haven't been tech-checked
      const prospects = await prisma.prospect.findMany({
        where: {
          website: { not: null },
          techStackRaw: { equals: Prisma.DbNull },
        },
        select: { id: true, website: true },
        take: 30, // Limit batch size
      })
      websitesToAnalyze = prospects
        .filter((p) => p.website)
        .map((p) => ({ id: p.id, website: p.website! }))
    }

    if (websitesToAnalyze.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No websites found to analyze',
      })
    }

    // Prepare input for BuiltWith
    const urls = websitesToAnalyze.map((w) => w.website)
    const input = {
      urls: urls.map((url) => (url.startsWith('http') ? url : `https://${url}`)),
    }

    const apifyRun = await startApifyRun(APIFY_ACTORS.BUILTWITH, input)

    // Create tracking job
    await prisma.systemJob.create({
      data: {
        jobType: 'tech_stack_detection',
        status: 'running',
        payload: JSON.stringify({
          apifyRunId: apifyRun.id,
          websiteMapping: websitesToAnalyze,
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
      message: `Started tech stack detection for ${urls.length} websites`,
    })
  } catch (error) {
    console.error('Error starting tech stack detection:', error)
    return NextResponse.json(
      { error: 'Failed to start tech detection', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * PUT - Import tech stack results and update prospects
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
    const results: BuiltWithResult[] = await getApifyDataset(finalDatasetId)

    let updated = 0
    let notFound = 0

    for (const result of results) {
      if (!result.url) continue

      // Find prospect by website
      const hostname = extractHostname(result.url)
      const prospect = await prisma.prospect.findFirst({
        where: {
          OR: [
            { website: { contains: hostname } },
            { website: result.url },
          ],
        },
      })

      if (!prospect) {
        notFound++
        continue
      }

      // Analyze the tech stack
      const allTechs = [
        ...(result.technologies || []).map((t) => t.name.toLowerCase()),
        ...(result.cms || []).map((c) => c.toLowerCase()),
        ...(result.analytics || []).map((a) => a.toLowerCase()),
        ...(result.widgets || []).map((w) => w.toLowerCase()),
      ]

      // Detect CMS
      const detectedCMS = CMS_SYSTEMS.find((cms) =>
        allTechs.some((tech) => tech.includes(cms))
      )
      const hasCMS = !!detectedCMS || (result.cms?.length || 0) > 0

      // Detect analytics
      const hasAnalytics = ANALYTICS_PLATFORMS.some((platform) =>
        allTechs.some((tech) => tech.includes(platform))
      ) || (result.analytics?.length || 0) > 0

      // Detect live chat
      const hasLiveChat = LIVE_CHAT_SYSTEMS.some((chat) =>
        allTechs.some((tech) => tech.includes(chat))
      )

      // Determine if they need a website (old tech, no CMS, bare bones)
      const needsWebsite = !hasCMS && !hasAnalytics && allTechs.length < 5

      const updateData: Record<string, any> = {
        techStackRaw: result,
        hasCMS,
        cmsType: detectedCMS || (result.cms?.[0] || null),
        hasAnalytics,
        hasLiveChat,
        needsWebsite,
        enrichedAt: new Date(),
        updatedAt: new Date(),
      }

      // Track enrichment sources
      const existingSources = prospect.enrichmentSources || []
      if (!existingSources.includes('builtwith')) {
        updateData.enrichmentSources = [...existingSources, 'builtwith']
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
    console.error('Error importing tech stack results:', error)
    return NextResponse.json(
      { error: 'Failed to import results', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * GET - Get tech stack summary for dashboard
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get tech stack insights across all prospects
    const [
      totalAnalyzed,
      needsWebsite,
      hasCMS,
      hasAnalytics,
      hasLiveChat,
    ] = await Promise.all([
      prisma.prospect.count({ where: { techStackRaw: { not: Prisma.DbNull } } }),
      prisma.prospect.count({ where: { needsWebsite: true } }),
      prisma.prospect.count({ where: { hasCMS: true } }),
      prisma.prospect.count({ where: { hasAnalytics: true } }),
      prisma.prospect.count({ where: { hasLiveChat: true } }),
    ])

    // Get CMS distribution
    const cmsDistribution = await prisma.prospect.groupBy({
      by: ['cmsType'],
      where: { cmsType: { not: null } },
      _count: { cmsType: true },
      orderBy: { _count: { cmsType: 'desc' } },
      take: 10,
    })

    return NextResponse.json({
      success: true,
      summary: {
        totalAnalyzed,
        needsWebsite,
        hasCMS,
        hasAnalytics,
        hasLiveChat,
        opportunityRate: totalAnalyzed > 0 
          ? Math.round((needsWebsite / totalAnalyzed) * 100) 
          : 0,
      },
      cmsDistribution: cmsDistribution.map((c) => ({
        cms: c.cmsType,
        count: c._count.cmsType,
      })),
    })
  } catch (error) {
    console.error('Error getting tech stack summary:', error)
    return NextResponse.json(
      { error: 'Failed to get summary', details: String(error) },
      { status: 500 }
    )
  }
}

function extractHostname(url: string): string {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`)
    return parsed.hostname.replace('www.', '')
  } catch {
    return url
  }
}
