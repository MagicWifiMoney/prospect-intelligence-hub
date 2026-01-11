import { prisma } from './db'
import { calculateEnhancedScores } from './scoring-enhanced'

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN

// Popular Apify actors for lead generation
export const APIFY_ACTORS = {
  // Core - Enhanced Google Maps with contact extraction
  GOOGLE_MAPS: 'lukaskrivka/google-maps-with-contact-details',
  GOOGLE_MAPS_PLUS: 'lukaskrivka/google-maps-with-contact-details', // Alias for clarity
  GOOGLE_SEARCH: 'apify/google-search-scraper',
  
  // Contact enrichment
  CONTACT_SCRAPER: 'vdrmota/contact-info-scraper',
  LEADS_FINDER: 'code_crafter/leads-finder',
  
  // Tech detection
  BUILTWITH: 'canadesk/builtwith',
  
  // Directories
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
  // Enhanced fields from lukaskrivka/google-maps-with-contact-details
  emails?: string[]
  email?: string
  socialProfiles?: {
    facebook?: string
    instagram?: string
    twitter?: string
    linkedin?: string
    youtube?: string
  }
  facebook?: string
  instagram?: string
  twitter?: string
  linkedin?: string
  contactInfo?: {
    emails?: string[]
    phones?: string[]
  }
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
 * Uses lukaskrivka/google-maps-with-contact-details for auto email/social extraction
 */
export async function scrapeGoogleMaps(
  searchQuery: string,
  maxResults: number = 100
): Promise<ApifyRunResult> {
  const input = {
    searchStringsArray: [searchQuery],
    maxCrawledPlacesPerSearch: maxResults,
    language: 'en',
    // Enhanced contact extraction options
    scrapeContactDetails: true,
    scrapeEmails: true,
    scrapeSocialProfiles: true,
    maxImages: 0,
    maxReviews: 5,
  }

  return startApifyRun(APIFY_ACTORS.GOOGLE_MAPS, input)
}

/**
 * Scrape multiple categories across multiple cities
 * Uses lukaskrivka/google-maps-with-contact-details for auto email/social extraction
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
    // Enhanced contact extraction options
    scrapeContactDetails: true,
    scrapeEmails: true,
    scrapeSocialProfiles: true,
    maxImages: 0,
    maxReviews: 3,
  }

  return startApifyRun(APIFY_ACTORS.GOOGLE_MAPS, input)
}

/**
 * Import Google Maps results into the database
 * Enhanced to handle contact details from lukaskrivka/google-maps-with-contact-details
 */
export async function importGoogleMapsResults(
  results: GoogleMapsResult[]
): Promise<{ imported: number; duplicates: number; errors: number }> {
  let imported = 0
  let duplicates = 0
  let errors = 0

  for (const result of results) {
    try {
      // Extract email from various possible fields
      const extractedEmail = result.email || 
        result.emails?.[0] || 
        result.contactInfo?.emails?.[0] || 
        null

      // Extract social profiles (handle various response formats)
      const socials = result.socialProfiles || {}
      const facebook = socials.facebook || result.facebook || null
      const instagram = socials.instagram || result.instagram || null
      const twitter = socials.twitter || result.twitter || null
      const linkedin = socials.linkedin || result.linkedin || null

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
        // Update existing prospect with fresh data including new enrichment fields
        const existingId = (existingByPlaceId || existingByName)!.id
        const existing = existingByPlaceId || existingByName
        
        await prisma.prospect.update({
          where: { id: existingId },
          data: {
            googleRating: result.totalScore || undefined,
            reviewCount: result.reviewsCount || undefined,
            website: result.website || undefined,
            phone: result.phone || undefined,
            // Only update email if we have one and they don't
            email: extractedEmail && !existing!.email ? extractedEmail : undefined,
            // Update social profiles if we have new data
            companyFacebook: facebook && !existing!.companyFacebook ? facebook : undefined,
            companyInstagram: instagram && !existing!.companyInstagram ? instagram : undefined,
            companyTwitter: twitter && !existing!.companyTwitter ? twitter : undefined,
            companyLinkedIn: linkedin && !existing!.companyLinkedIn ? linkedin : undefined,
            // Track enrichment
            enrichedAt: extractedEmail || facebook || instagram || twitter || linkedin 
              ? new Date() : undefined,
            updatedAt: new Date(),
          },
        })
        duplicates++
        continue
      }

      // Create new prospect with all available data
      const newProspect = await prisma.prospect.create({
        data: {
          companyName: result.title,
          businessType: result.categoryName || result.categories?.[0] || null,
          categories: result.categories?.join(', ') || null,
          address: result.address || null,
          city: result.city || extractCity(result.address),
          phone: result.phone || result.contactInfo?.phones?.[0] || null,
          email: extractedEmail,
          website: result.website || null,
          gbpUrl: result.url || null,
          placeId: result.placeId || null,
          googleRating: result.totalScore || null,
          reviewCount: result.reviewsCount || null,
          // Social profiles from enhanced scraper
          companyFacebook: facebook,
          companyInstagram: instagram,
          companyTwitter: twitter,
          companyLinkedIn: linkedin,
          // Enrichment tracking
          enrichedAt: extractedEmail || facebook || instagram || twitter || linkedin 
            ? new Date() : null,
          enrichmentSources: ['google_maps_plus'],
          dataSource: 'apify_google_maps_plus',
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
          scoringFactors: JSON.parse(JSON.stringify(scores.scoringFactors)),
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
