import { prisma } from './db'
import { calculateEnhancedScores } from './scoring-enhanced'

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN

// Popular Apify actors for lead generation
export const APIFY_ACTORS = {
  GOOGLE_MAPS: 'compass/crawler-google-places',
  GOOGLE_SEARCH: 'apify/google-search-scraper',
  YELP: 'maxcopell/yelp-scraper',
  YELLOW_PAGES: 'tugkan/yellow-pages-scraper',
}

// Minnesota cities to target
export const MN_CITIES = [
  'Minneapolis, MN',
  'St Paul, MN',
  'Bloomington, MN',
  'Brooklyn Park, MN',
  'Plymouth, MN',
  'Maple Grove, MN',
  'Woodbury, MN',
  'Eden Prairie, MN',
  'Burnsville, MN',
  'Lakeville, MN',
  'Eagan, MN',
  'Blaine, MN',
  'Coon Rapids, MN',
  'Shakopee, MN',
  'Minnetonka, MN',
  'Apple Valley, MN',
  'Edina, MN',
  'St Louis Park, MN',
  'Richfield, MN',
  'Roseville, MN',
]

// Service categories to scrape
export const SERVICE_CATEGORIES = [
  'plumber',
  'plumbing contractor',
  'hvac contractor',
  'heating and cooling',
  'roofing contractor',
  'roofer',
  'electrician',
  'electrical contractor',
  'garage door repair',
  'pest control',
  'tree service',
  'concrete contractor',
  'fence contractor',
  'gutter installation',
  'landscaping',
  'lawn care',
  'painting contractor',
  'remodeling contractor',
  'foundation repair',
  'water damage restoration',
]

interface GoogleMapsResult {
  title: string
  categoryName?: string
  address?: string
  city?: string
  phone?: string
  website?: string
  totalScore?: number
  reviewsCount?: number
  url?: string
  placeId?: string
  categories?: string[]
}

interface ApifyRunResult {
  id: string
  status: string
  datasetId?: string
}

/**
 * Start an Apify actor run
 */
export async function startApifyRun(
  actorId: string,
  input: Record<string, any>
): Promise<ApifyRunResult> {
  const response = await fetch(
    `https://api.apify.com/v2/acts/${actorId}/runs?token=${APIFY_API_TOKEN}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Apify API error: ${error}`)
  }

  const data = await response.json()
  return {
    id: data.data.id,
    status: data.data.status,
    datasetId: data.data.defaultDatasetId,
  }
}

/**
 * Check the status of an Apify run
 */
export async function getApifyRunStatus(runId: string): Promise<ApifyRunResult> {
  const response = await fetch(
    `https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_API_TOKEN}`
  )

  if (!response.ok) {
    throw new Error('Failed to get run status')
  }

  const data = await response.json()
  return {
    id: data.data.id,
    status: data.data.status,
    datasetId: data.data.defaultDatasetId,
  }
}

/**
 * Get results from an Apify dataset
 */
export async function getApifyDataset(datasetId: string): Promise<any[]> {
  const response = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_API_TOKEN}`
  )

  if (!response.ok) {
    throw new Error('Failed to get dataset')
  }

  return response.json()
}

/**
 * Start a Google Maps scrape for a specific search
 */
export async function scrapeGoogleMaps(
  searchQuery: string,
  maxResults: number = 100
): Promise<ApifyRunResult> {
  const input = {
    searchStringsArray: [searchQuery],
    maxCrawledPlacesPerSearch: maxResults,
    language: 'en',
    exportPlaceUrls: false,
    includeWebResults: false,
    maxImages: 0,
    maxReviews: 5,
    scrapeReviewerName: false,
    scrapeReviewId: false,
    scrapeReviewUrl: false,
    scrapeResponseFromOwnerText: false,
  }

  return startApifyRun(APIFY_ACTORS.GOOGLE_MAPS, input)
}

/**
 * Scrape multiple categories across multiple cities
 */
export async function scrapeMultipleSearches(
  categories: string[],
  cities: string[],
  maxResultsPerSearch: number = 50
): Promise<ApifyRunResult> {
  const searchStrings = []

  for (const category of categories) {
    for (const city of cities) {
      searchStrings.push(`${category} in ${city}`)
    }
  }

  const input = {
    searchStringsArray: searchStrings,
    maxCrawledPlacesPerSearch: maxResultsPerSearch,
    language: 'en',
    exportPlaceUrls: false,
    includeWebResults: false,
    maxImages: 0,
    maxReviews: 3,
  }

  return startApifyRun(APIFY_ACTORS.GOOGLE_MAPS, input)
}

/**
 * Import Google Maps results into the database
 */
export async function importGoogleMapsResults(
  results: GoogleMapsResult[]
): Promise<{ imported: number; duplicates: number; errors: number }> {
  let imported = 0
  let duplicates = 0
  let errors = 0

  for (const result of results) {
    try {
      // Check for duplicate by placeId or company name + city
      const existingByPlaceId = result.placeId
        ? await prisma.prospect.findUnique({ where: { placeId: result.placeId } })
        : null

      const existingByName = !existingByPlaceId
        ? await prisma.prospect.findFirst({
            where: {
              companyName: { equals: result.title, mode: 'insensitive' },
              city: { equals: result.city || '', mode: 'insensitive' },
            },
          })
        : null

      if (existingByPlaceId || existingByName) {
        // Update existing prospect with fresh data
        const existingId = (existingByPlaceId || existingByName)!.id
        await prisma.prospect.update({
          where: { id: existingId },
          data: {
            googleRating: result.totalScore || undefined,
            reviewCount: result.reviewsCount || undefined,
            website: result.website || undefined,
            phone: result.phone || undefined,
            updatedAt: new Date(),
          },
        })
        duplicates++
        continue
      }

      // Create new prospect
      const newProspect = await prisma.prospect.create({
        data: {
          companyName: result.title,
          businessType: result.categoryName || result.categories?.[0] || null,
          categories: result.categories?.join(', ') || null,
          address: result.address || null,
          city: result.city || extractCity(result.address),
          phone: result.phone || null,
          website: result.website || null,
          gbpUrl: result.url || null,
          placeId: result.placeId || null,
          googleRating: result.totalScore || null,
          reviewCount: result.reviewsCount || null,
          dataSource: 'apify_google_maps',
          dateCollected: new Date(),
        },
      })

      // Calculate enhanced scores
      const scores = calculateEnhancedScores(newProspect)
      await prisma.prospect.update({
        where: { id: newProspect.id },
        data: {
          highTicketScore: scores.highTicketScore,
          opportunityScore: scores.opportunityScore,
          leadGenScore: scores.leadGenScore,
          scoringFactors: scores.scoringFactors,
          opportunityTags: scores.opportunityTags,
        },
      })

      imported++
    } catch (error) {
      console.error('Error importing result:', error)
      errors++
    }
  }

  return { imported, duplicates, errors }
}

/**
 * Extract city from address string
 */
function extractCity(address?: string): string | null {
  if (!address) return null

  // Try to extract city from address like "123 Main St, Minneapolis, MN 55401"
  const parts = address.split(',')
  if (parts.length >= 2) {
    return parts[parts.length - 2].trim()
  }
  return null
}

/**
 * Create a scrape job record
 */
export async function createScrapeJob(
  searchQuery: string,
  apifyRunId: string,
  categories: string[],
  cities: string[]
): Promise<string> {
  const job = await prisma.systemJob.create({
    data: {
      jobType: 'apify_scrape',
      status: 'running',
      payload: JSON.stringify({
        searchQuery,
        apifyRunId,
        categories,
        cities,
      }),
      scheduledAt: new Date(),
      startedAt: new Date(),
    },
  })
  return job.id
}

/**
 * Update scrape job with results
 */
export async function updateScrapeJob(
  jobId: string,
  status: string,
  result?: { imported: number; duplicates: number; errors: number }
) {
  await prisma.systemJob.update({
    where: { id: jobId },
    data: {
      status,
      result: result ? JSON.stringify(result) : null,
      completedAt: status === 'completed' || status === 'failed' ? new Date() : null,
    },
  })
}

/**
 * Get recent scrape jobs
 */
export async function getRecentScrapeJobs(limit: number = 10) {
  return prisma.systemJob.findMany({
    where: { jobType: 'apify_scrape' },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}
