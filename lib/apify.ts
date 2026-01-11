import { prisma } from './db'
import { calculateEnhancedScores } from './scoring-enhanced'

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN

// Popular Apify actors for lead generation
export const APIFY_ACTORS = {
  // Core scrapers (Phase 1)
  GOOGLE_MAPS: 'lukaskrivka/google-maps-with-contact-details',  // Enhanced: includes email/social extraction
  CONTACT_SCRAPER: 'vdrmota/contact-info-scraper',              // Website contact extraction
  LEADS_FINDER: 'code_crafter/leads-finder',                    // Apollo-style decision maker lookup
  BUILTWITH: 'canadesk/builtwith',                              // Tech stack detection

  // Directory scrapers (Phase 2)
  YELP_LISTINGS: 'jupri/yelp',
  YELP_REVIEWS: 'delicious_zebu/yelp-reviews-scraper',
  ANGI: 'igolaizola/angi-scraper',
  YELLOW_PAGES: 'trudax/yellow-pages-us-scraper',

  // Social scrapers (Phase 3)
  FACEBOOK_PAGES: 'apify/facebook-pages-scraper',
  LINKEDIN_COMPANY: 'apimaestro/linkedin-company-detail',

  // Legacy/bonus
  GOOGLE_SEARCH: 'apify/google-search-scraper',
  GOOGLE_REVIEWS_DEEP: 'compass/Google-Maps-Reviews-Scraper',
  BBB: 'scraped/bbb',
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

// Enhanced Google Maps result (from lukaskrivka/google-maps-with-contact-details)
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
  // Enhanced fields from contact extraction
  email?: string
  emails?: string[]
  socialProfiles?: {
    facebook?: string
    instagram?: string
    twitter?: string
    linkedin?: string
    youtube?: string
  }
  contactInfo?: {
    emails?: string[]
    phones?: string[]
  }
}

// Contact scraper result (from vdrmota/contact-info-scraper)
export interface ContactScraperResult {
  url: string
  emails?: string[]
  phones?: string[]
  linkedin?: string
  facebook?: string
  instagram?: string
  twitter?: string
  youtube?: string
}

// Leads finder result (from code_crafter/leads-finder)
export interface LeadsFinderResult {
  company?: string
  domain?: string
  contacts?: Array<{
    name?: string
    title?: string
    email?: string
    phone?: string
    linkedin?: string
  }>
}

// BuiltWith result (from canadesk/builtwith)
export interface BuiltWithResult {
  domain: string
  technologies?: Array<{
    name: string
    category: string
    description?: string
  }>
  cms?: string
  analytics?: string[]
  widgets?: string[]
  ecommerce?: string
  hosting?: string
}

// Yelp result (from jupri/yelp)
export interface YelpResult {
  name: string
  url?: string
  rating?: number
  reviewCount?: number
  price?: string           // $, $$, $$$, $$$$
  phone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  categories?: string[]
  neighborhood?: string
  latitude?: number
  longitude?: number
  isClaimed?: boolean
  isOpen?: boolean
  photos?: string[]
}

// Angi result (from igolaizola/angi-scraper)
export interface AngiResult {
  name: string
  url?: string
  rating?: number
  reviewCount?: number
  phone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  categories?: string[]
  yearsInBusiness?: number
  hireRate?: number        // Percentage of users who hired
  responseTime?: string    // e.g., "within a day"
  license?: string
  description?: string
}

// Yellow Pages result (from trudax/yellow-pages-us-scraper)
export interface YellowPagesResult {
  name: string
  url?: string
  rating?: number
  reviewCount?: number
  phone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  categories?: string[]
  yearsInBusiness?: number
  website?: string
  hours?: string
  description?: string
}

// Facebook Pages result (from apify/facebook-pages-scraper)
export interface FacebookPagesResult {
  name: string
  url: string
  pageId?: string
  about?: string
  category?: string
  website?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  likes?: number
  followers?: number
  rating?: number
  reviewCount?: number
  lastPostDate?: string
  isVerified?: boolean
  coverPhoto?: string
  profilePhoto?: string
}

// LinkedIn Company result (from apimaestro/linkedin-company-detail)
export interface LinkedInCompanyResult {
  name: string
  url: string
  linkedInId?: string
  description?: string
  website?: string
  industry?: string
  employeeCount?: number
  employeeRange?: string    // e.g., "11-50 employees"
  headquarters?: string
  foundedYear?: number
  specialties?: string[]
  type?: string             // e.g., "Privately Held"
  logo?: string
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

      // Extract emails from enhanced Google Maps result
      const allEmails = [
        result.email,
        ...(result.emails || []),
        ...(result.contactInfo?.emails || []),
      ].filter(Boolean) as string[]

      const primaryEmail = allEmails[0] || null
      const additionalEmails = allEmails.slice(1)

      // Extract social profiles
      const socials = result.socialProfiles || {}

      // Create new prospect with enhanced fields
      const newProspect = await prisma.prospect.create({
        data: {
          companyName: result.title,
          businessType: result.categoryName || result.categories?.[0] || null,
          categories: result.categories?.join(', ') || null,
          address: result.address || null,
          city: result.city || extractCity(result.address),
          phone: result.phone || null,
          email: primaryEmail,
          website: result.website || null,
          gbpUrl: result.url || null,
          placeId: result.placeId || null,
          googleRating: result.totalScore || null,
          reviewCount: result.reviewsCount || null,
          dataSource: 'apify_google_maps',
          dateCollected: new Date(),
          // Enhanced fields
          additionalEmails: additionalEmails,
          companyFacebook: socials.facebook || null,
          companyInstagram: socials.instagram || null,
          companyTwitter: socials.twitter || null,
          companyLinkedIn: socials.linkedin || null,
          companyYouTube: socials.youtube || null,
          enrichmentSources: ['google_maps'],
          enrichedAt: allEmails.length > 0 || Object.keys(socials).length > 0 ? new Date() : null,
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

// ============================================
// PHASE 1: New Enrichment Functions
// ============================================

/**
 * Scrape website for contact info (emails, phones, socials)
 * Uses: vdrmota/contact-info-scraper
 */
export async function scrapeWebsiteContacts(
  urls: string[]
): Promise<ApifyRunResult> {
  const input = {
    startUrls: urls.map(url => ({ url })),
    maxDepth: 2,
    maxPagesPerDomain: 10,
    sameDomainOnly: true,
  }

  return startApifyRun(APIFY_ACTORS.CONTACT_SCRAPER, input)
}

/**
 * Find decision makers for a company (Apollo-style)
 * Uses: code_crafter/leads-finder
 */
export async function findDecisionMakers(
  companyName: string,
  domain?: string
): Promise<ApifyRunResult> {
  const input = {
    companies: [{
      name: companyName,
      domain: domain,
    }],
    roles: ['owner', 'ceo', 'president', 'founder', 'manager', 'director'],
    limit: 5,
  }

  return startApifyRun(APIFY_ACTORS.LEADS_FINDER, input)
}

/**
 * Detect tech stack for a website
 * Uses: canadesk/builtwith
 */
export async function detectTechStack(
  domain: string
): Promise<ApifyRunResult> {
  const input = {
    urls: [domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '')],
  }

  return startApifyRun(APIFY_ACTORS.BUILTWITH, input)
}

/**
 * Enrich a prospect with contact scraper results
 */
export async function enrichProspectWithContacts(
  prospectId: string,
  contactData: ContactScraperResult
): Promise<void> {
  const prospect = await prisma.prospect.findUnique({ where: { id: prospectId } })
  if (!prospect) throw new Error('Prospect not found')

  // Merge emails (avoid duplicates)
  const existingEmails = [prospect.email, ...(prospect.additionalEmails || [])].filter(Boolean) as string[]
  const newEmails = contactData.emails || []
  const allEmails = [...new Set([...existingEmails, ...newEmails])]

  const primaryEmail = allEmails[0] || null
  const additionalEmails = allEmails.slice(1)

  // Update enrichment sources
  const sources = [...(prospect.enrichmentSources || []), 'contact_scraper']

  await prisma.prospect.update({
    where: { id: prospectId },
    data: {
      email: primaryEmail,
      additionalEmails,
      companyLinkedIn: contactData.linkedin || prospect.companyLinkedIn,
      companyFacebook: contactData.facebook || prospect.companyFacebook,
      companyInstagram: contactData.instagram || prospect.companyInstagram,
      companyTwitter: contactData.twitter || prospect.companyTwitter,
      companyYouTube: contactData.youtube || prospect.companyYouTube,
      enrichmentSources: [...new Set(sources)],
      enrichedAt: new Date(),
    },
  })
}

/**
 * Enrich a prospect with decision maker info
 */
export async function enrichProspectWithDecisionMaker(
  prospectId: string,
  leadsData: LeadsFinderResult
): Promise<void> {
  const contact = leadsData.contacts?.[0]
  if (!contact) return

  const sources = await prisma.prospect.findUnique({
    where: { id: prospectId },
    select: { enrichmentSources: true }
  })

  await prisma.prospect.update({
    where: { id: prospectId },
    data: {
      ownerName: contact.name || undefined,
      ownerTitle: contact.title || undefined,
      ownerEmail: contact.email || undefined,
      ownerPhone: contact.phone || undefined,
      ownerLinkedIn: contact.linkedin || undefined,
      enrichmentSources: [...new Set([...(sources?.enrichmentSources || []), 'leads_finder'])],
      enrichedAt: new Date(),
    },
  })
}

/**
 * Enrich a prospect with tech stack info
 */
export async function enrichProspectWithTechStack(
  prospectId: string,
  techData: BuiltWithResult
): Promise<void> {
  const techs = techData.technologies || []

  // Categorize technologies
  const cms = techs.find(t =>
    t.category?.toLowerCase().includes('cms') ||
    ['wordpress', 'wix', 'squarespace', 'shopify', 'webflow', 'drupal', 'joomla'].some(
      c => t.name?.toLowerCase().includes(c)
    )
  )

  const analytics = techs.filter(t =>
    t.category?.toLowerCase().includes('analytics') ||
    t.name?.toLowerCase().includes('analytics') ||
    t.name?.toLowerCase().includes('tag manager')
  )

  const liveChat = techs.find(t =>
    t.category?.toLowerCase().includes('chat') ||
    ['intercom', 'drift', 'zendesk', 'freshchat', 'tawk', 'livechat'].some(
      c => t.name?.toLowerCase().includes(c)
    )
  )

  const ecommerce = techs.find(t =>
    t.category?.toLowerCase().includes('ecommerce') ||
    ['shopify', 'woocommerce', 'bigcommerce', 'magento'].some(
      c => t.name?.toLowerCase().includes(c)
    )
  )

  const hasBooking = techs.some(t =>
    ['calendly', 'acuity', 'booking', 'schedule'].some(
      c => t.name?.toLowerCase().includes(c)
    )
  )

  const hasForms = techs.some(t =>
    ['typeform', 'jotform', 'gravity forms', 'wpforms', 'contact form'].some(
      c => t.name?.toLowerCase().includes(c)
    )
  )

  const sources = await prisma.prospect.findUnique({
    where: { id: prospectId },
    select: { enrichmentSources: true }
  })

  await prisma.prospect.update({
    where: { id: prospectId },
    data: {
      techStackRaw: techs as any,
      hasCMS: !!cms,
      cmsType: cms?.name || techData.cms || null,
      hasAnalytics: analytics.length > 0,
      analyticsType: analytics.map(a => a.name).join(', ') || null,
      hasLiveChat: !!liveChat,
      liveChatType: liveChat?.name || null,
      hasBookingWidget: hasBooking,
      hasForms: hasForms,
      hasEcommerce: !!ecommerce,
      needsWebsite: !cms && techs.length < 3, // Basic heuristic
      enrichmentSources: [...new Set([...(sources?.enrichmentSources || []), 'builtwith'])],
      enrichedAt: new Date(),
    },
  })
}

/**
 * Bulk enrich prospects missing email
 * Returns prospects that need enrichment
 */
export async function getProspectsNeedingEnrichment(
  limit: number = 50
): Promise<Array<{ id: string; companyName: string; website: string }>> {
  const prospects = await prisma.prospect.findMany({
    where: {
      email: null,
      website: { not: null },
      OR: [
        { enrichedAt: null },
        { enrichedAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }, // Re-enrich after 30 days
      ],
    },
    select: {
      id: true,
      companyName: true,
      website: true,
    },
    take: limit,
    orderBy: { createdAt: 'desc' },
  })

  return prospects.filter(p => p.website) as Array<{ id: string; companyName: string; website: string }>
}

// ============================================
// PHASE 2: Yelp Integration Functions
// ============================================

/**
 * Scrape Yelp for business listings
 * Uses: jupri/yelp
 */
export async function scrapeYelp(
  searchQuery: string,
  location: string,
  maxResults: number = 50
): Promise<ApifyRunResult> {
  const input = {
    searchTerms: [searchQuery],
    locations: [location],
    maxItems: maxResults,
    includeReviews: false,
    reviewsLimit: 0,
  }

  return startApifyRun(APIFY_ACTORS.YELP_LISTINGS, input)
}

/**
 * Match a Yelp result to an existing prospect by phone or address
 */
export async function matchYelpToProspect(
  yelpData: YelpResult,
  scopeFilter: { userId?: string; organizationId?: string | null }
): Promise<string | null> {
  // Clean phone number for matching (remove non-digits)
  const cleanPhone = yelpData.phone?.replace(/\D/g, '') || null

  // Try to find by phone number first (most reliable)
  if (cleanPhone && cleanPhone.length >= 10) {
    const byPhone = await prisma.prospect.findFirst({
      where: {
        phone: { contains: cleanPhone.slice(-10) }, // Match last 10 digits
        ...scopeFilter,
      },
      select: { id: true },
    })
    if (byPhone) return byPhone.id
  }

  // Try to find by company name + city (fuzzy match)
  if (yelpData.name && yelpData.city) {
    const byNameCity = await prisma.prospect.findFirst({
      where: {
        companyName: { contains: yelpData.name.split(' ')[0], mode: 'insensitive' },
        city: { contains: yelpData.city, mode: 'insensitive' },
        ...scopeFilter,
      },
      select: { id: true },
    })
    if (byNameCity) return byNameCity.id
  }

  return null
}

/**
 * Enrich a prospect with Yelp data
 */
export async function enrichProspectWithYelp(
  prospectId: string,
  yelpData: YelpResult
): Promise<void> {
  const sources = await prisma.prospect.findUnique({
    where: { id: prospectId },
    select: { enrichmentSources: true },
  })

  await prisma.prospect.update({
    where: { id: prospectId },
    data: {
      yelpUrl: yelpData.url || undefined,
      yelpRating: yelpData.rating || undefined,
      yelpReviewCount: yelpData.reviewCount || undefined,
      enrichmentSources: [...new Set([...(sources?.enrichmentSources || []), 'yelp'])],
      enrichedAt: new Date(),
    },
  })
}

/**
 * Import Yelp results - match with existing prospects or create new ones
 */
export async function importYelpResults(
  results: YelpResult[],
  scopeFilter: { userId: string; organizationId: string | null }
): Promise<{ matched: number; created: number; errors: number }> {
  let matched = 0
  let created = 0
  let errors = 0

  for (const result of results) {
    try {
      // Try to match with existing prospect
      const existingId = await matchYelpToProspect(result, scopeFilter)

      if (existingId) {
        // Enrich existing prospect
        await enrichProspectWithYelp(existingId, result)
        matched++
      } else {
        // Create new prospect from Yelp data
        await prisma.prospect.create({
          data: {
            companyName: result.name,
            businessType: result.categories?.[0] || null,
            categories: result.categories?.join(', ') || null,
            address: result.address || null,
            city: result.city || null,
            phone: result.phone || null,
            yelpUrl: result.url || null,
            yelpRating: result.rating || null,
            yelpReviewCount: result.reviewCount || null,
            dataSource: 'yelp',
            dateCollected: new Date(),
            enrichmentSources: ['yelp'],
            enrichedAt: new Date(),
            userId: scopeFilter.userId,
            organizationId: scopeFilter.organizationId,
          },
        })
        created++
      }
    } catch (error) {
      console.error('Error processing Yelp result:', error)
      errors++
    }
  }

  return { matched, created, errors }
}

// ============================================
// PHASE 2: Angi Integration Functions
// ============================================

/**
 * Scrape Angi for business listings
 * Uses: igolaizola/angi-scraper
 */
export async function scrapeAngi(
  searchQuery: string,
  location: string,
  maxResults: number = 50
): Promise<ApifyRunResult> {
  const input = {
    search: searchQuery,
    location: location,
    maxItems: maxResults,
  }

  return startApifyRun(APIFY_ACTORS.ANGI, input)
}

/**
 * Match an Angi result to an existing prospect
 */
export async function matchAngiToProspect(
  angiData: AngiResult,
  scopeFilter: { userId?: string; organizationId?: string | null }
): Promise<string | null> {
  const cleanPhone = angiData.phone?.replace(/\D/g, '') || null

  if (cleanPhone && cleanPhone.length >= 10) {
    const byPhone = await prisma.prospect.findFirst({
      where: {
        phone: { contains: cleanPhone.slice(-10) },
        ...scopeFilter,
      },
      select: { id: true },
    })
    if (byPhone) return byPhone.id
  }

  if (angiData.name && angiData.city) {
    const byNameCity = await prisma.prospect.findFirst({
      where: {
        companyName: { contains: angiData.name.split(' ')[0], mode: 'insensitive' },
        city: { contains: angiData.city, mode: 'insensitive' },
        ...scopeFilter,
      },
      select: { id: true },
    })
    if (byNameCity) return byNameCity.id
  }

  return null
}

/**
 * Enrich a prospect with Angi data
 */
export async function enrichProspectWithAngi(
  prospectId: string,
  angiData: AngiResult
): Promise<void> {
  const sources = await prisma.prospect.findUnique({
    where: { id: prospectId },
    select: { enrichmentSources: true },
  })

  await prisma.prospect.update({
    where: { id: prospectId },
    data: {
      angiRating: angiData.rating || undefined,
      angiReviewCount: angiData.reviewCount || undefined,
      enrichmentSources: [...new Set([...(sources?.enrichmentSources || []), 'angi'])],
      enrichedAt: new Date(),
    },
  })
}

/**
 * Import Angi results
 */
export async function importAngiResults(
  results: AngiResult[],
  scopeFilter: { userId: string; organizationId: string | null }
): Promise<{ matched: number; created: number; errors: number }> {
  let matched = 0
  let created = 0
  let errors = 0

  for (const result of results) {
    try {
      const existingId = await matchAngiToProspect(result, scopeFilter)

      if (existingId) {
        await enrichProspectWithAngi(existingId, result)
        matched++
      } else {
        await prisma.prospect.create({
          data: {
            companyName: result.name,
            businessType: result.categories?.[0] || null,
            categories: result.categories?.join(', ') || null,
            address: result.address || null,
            city: result.city || null,
            phone: result.phone || null,
            angiRating: result.rating || null,
            angiReviewCount: result.reviewCount || null,
            yearsInBusiness: result.yearsInBusiness || null,
            dataSource: 'angi',
            dateCollected: new Date(),
            enrichmentSources: ['angi'],
            enrichedAt: new Date(),
            userId: scopeFilter.userId,
            organizationId: scopeFilter.organizationId,
          },
        })
        created++
      }
    } catch (error) {
      console.error('Error processing Angi result:', error)
      errors++
    }
  }

  return { matched, created, errors }
}

// ============================================
// PHASE 2: Yellow Pages Integration Functions
// ============================================

/**
 * Scrape Yellow Pages for business listings
 * Uses: trudax/yellow-pages-us-scraper
 */
export async function scrapeYellowPages(
  searchQuery: string,
  location: string,
  maxResults: number = 50
): Promise<ApifyRunResult> {
  const input = {
    search: searchQuery,
    location: location,
    maxItems: maxResults,
  }

  return startApifyRun(APIFY_ACTORS.YELLOW_PAGES, input)
}

/**
 * Match a Yellow Pages result to an existing prospect
 */
export async function matchYellowPagesToProspect(
  ypData: YellowPagesResult,
  scopeFilter: { userId?: string; organizationId?: string | null }
): Promise<string | null> {
  const cleanPhone = ypData.phone?.replace(/\D/g, '') || null

  if (cleanPhone && cleanPhone.length >= 10) {
    const byPhone = await prisma.prospect.findFirst({
      where: {
        phone: { contains: cleanPhone.slice(-10) },
        ...scopeFilter,
      },
      select: { id: true },
    })
    if (byPhone) return byPhone.id
  }

  if (ypData.name && ypData.city) {
    const byNameCity = await prisma.prospect.findFirst({
      where: {
        companyName: { contains: ypData.name.split(' ')[0], mode: 'insensitive' },
        city: { contains: ypData.city, mode: 'insensitive' },
        ...scopeFilter,
      },
      select: { id: true },
    })
    if (byNameCity) return byNameCity.id
  }

  return null
}

/**
 * Import Yellow Pages results
 */
export async function importYellowPagesResults(
  results: YellowPagesResult[],
  scopeFilter: { userId: string; organizationId: string | null }
): Promise<{ matched: number; created: number; errors: number }> {
  let matched = 0
  let created = 0
  let errors = 0

  for (const result of results) {
    try {
      const existingId = await matchYellowPagesToProspect(result, scopeFilter)

      if (existingId) {
        // Yellow Pages enrichment - just add to sources
        const sources = await prisma.prospect.findUnique({
          where: { id: existingId },
          select: { enrichmentSources: true, website: true },
        })

        await prisma.prospect.update({
          where: { id: existingId },
          data: {
            website: sources?.website || result.website || undefined,
            enrichmentSources: [...new Set([...(sources?.enrichmentSources || []), 'yellow_pages'])],
            enrichedAt: new Date(),
          },
        })
        matched++
      } else {
        await prisma.prospect.create({
          data: {
            companyName: result.name,
            businessType: result.categories?.[0] || null,
            categories: result.categories?.join(', ') || null,
            address: result.address || null,
            city: result.city || null,
            phone: result.phone || null,
            website: result.website || null,
            yearsInBusiness: result.yearsInBusiness || null,
            dataSource: 'yellow_pages',
            dateCollected: new Date(),
            enrichmentSources: ['yellow_pages'],
            enrichedAt: new Date(),
            userId: scopeFilter.userId,
            organizationId: scopeFilter.organizationId,
          },
        })
        created++
      }
    } catch (error) {
      console.error('Error processing Yellow Pages result:', error)
      errors++
    }
  }

  return { matched, created, errors }
}

// ============================================
// PHASE 3: Facebook Pages Integration
// ============================================

/**
 * Scrape Facebook for business pages
 * Uses: apify/facebook-pages-scraper
 */
export async function scrapeFacebookPages(
  searchQuery: string,
  maxResults: number = 50
): Promise<ApifyRunResult> {
  const input = {
    searchQuery: searchQuery,
    maxPages: maxResults,
  }

  return startApifyRun(APIFY_ACTORS.FACEBOOK_PAGES, input)
}

/**
 * Match a Facebook page to existing prospect by website or phone
 */
export async function matchFacebookToProspect(
  fbData: FacebookPagesResult,
  scopeFilter: { userId?: string; organizationId?: string | null }
): Promise<string | null> {
  // Try by website domain
  if (fbData.website) {
    const domain = fbData.website.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase()
    const byWebsite = await prisma.prospect.findFirst({
      where: {
        website: { contains: domain, mode: 'insensitive' },
        ...scopeFilter,
      },
      select: { id: true },
    })
    if (byWebsite) return byWebsite.id
  }

  // Try by phone
  const cleanPhone = fbData.phone?.replace(/\D/g, '') || null
  if (cleanPhone && cleanPhone.length >= 10) {
    const byPhone = await prisma.prospect.findFirst({
      where: {
        phone: { contains: cleanPhone.slice(-10) },
        ...scopeFilter,
      },
      select: { id: true },
    })
    if (byPhone) return byPhone.id
  }

  // Try by name
  if (fbData.name) {
    const byName = await prisma.prospect.findFirst({
      where: {
        companyName: { contains: fbData.name.split(' ')[0], mode: 'insensitive' },
        ...scopeFilter,
      },
      select: { id: true },
    })
    if (byName) return byName.id
  }

  return null
}

/**
 * Enrich a prospect with Facebook data
 */
export async function enrichProspectWithFacebook(
  prospectId: string,
  fbData: FacebookPagesResult
): Promise<void> {
  const sources = await prisma.prospect.findUnique({
    where: { id: prospectId },
    select: { enrichmentSources: true },
  })

  await prisma.prospect.update({
    where: { id: prospectId },
    data: {
      companyFacebook: fbData.url || undefined,
      facebookRating: fbData.rating || undefined,
      facebookReviewCount: fbData.reviewCount || undefined,
      enrichmentSources: [...new Set([...(sources?.enrichmentSources || []), 'facebook'])],
      enrichedAt: new Date(),
    },
  })
}

/**
 * Import Facebook Pages results
 */
export async function importFacebookResults(
  results: FacebookPagesResult[],
  scopeFilter: { userId: string; organizationId: string | null }
): Promise<{ matched: number; created: number; errors: number }> {
  let matched = 0
  let created = 0
  let errors = 0

  for (const result of results) {
    try {
      const existingId = await matchFacebookToProspect(result, scopeFilter)

      if (existingId) {
        await enrichProspectWithFacebook(existingId, result)
        matched++
      } else {
        // Create new prospect from Facebook data
        await prisma.prospect.create({
          data: {
            companyName: result.name,
            businessType: result.category || null,
            address: result.address || null,
            city: result.city || null,
            phone: result.phone || null,
            email: result.email || null,
            website: result.website || null,
            companyFacebook: result.url,
            facebookRating: result.rating || null,
            facebookReviewCount: result.reviewCount || null,
            dataSource: 'facebook',
            dateCollected: new Date(),
            enrichmentSources: ['facebook'],
            enrichedAt: new Date(),
            userId: scopeFilter.userId,
            organizationId: scopeFilter.organizationId,
          },
        })
        created++
      }
    } catch (error) {
      console.error('Error processing Facebook result:', error)
      errors++
    }
  }

  return { matched, created, errors }
}

// ============================================
// PHASE 3: LinkedIn Company Integration
// ============================================

/**
 * Scrape LinkedIn for company details
 * Uses: apimaestro/linkedin-company-detail
 */
export async function scrapeLinkedInCompany(
  companyUrl: string
): Promise<ApifyRunResult> {
  const input = {
    urls: [companyUrl],
  }

  return startApifyRun(APIFY_ACTORS.LINKEDIN_COMPANY, input)
}

/**
 * Match a LinkedIn company to existing prospect
 */
export async function matchLinkedInToProspect(
  liData: LinkedInCompanyResult,
  scopeFilter: { userId?: string; organizationId?: string | null }
): Promise<string | null> {
  // Try by website domain
  if (liData.website) {
    const domain = liData.website.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase()
    const byWebsite = await prisma.prospect.findFirst({
      where: {
        website: { contains: domain, mode: 'insensitive' },
        ...scopeFilter,
      },
      select: { id: true },
    })
    if (byWebsite) return byWebsite.id
  }

  // Try by company name
  if (liData.name) {
    const byName = await prisma.prospect.findFirst({
      where: {
        companyName: { contains: liData.name.split(' ')[0], mode: 'insensitive' },
        ...scopeFilter,
      },
      select: { id: true },
    })
    if (byName) return byName.id
  }

  return null
}

/**
 * Enrich a prospect with LinkedIn data
 */
export async function enrichProspectWithLinkedIn(
  prospectId: string,
  liData: LinkedInCompanyResult
): Promise<void> {
  const sources = await prisma.prospect.findUnique({
    where: { id: prospectId },
    select: { enrichmentSources: true },
  })

  await prisma.prospect.update({
    where: { id: prospectId },
    data: {
      companyLinkedIn: liData.url || undefined,
      employeeCount: liData.employeeCount || undefined,
      enrichmentSources: [...new Set([...(sources?.enrichmentSources || []), 'linkedin'])],
      enrichedAt: new Date(),
    },
  })
}

/**
 * Import LinkedIn results - typically used for enrichment only
 */
export async function importLinkedInResults(
  results: LinkedInCompanyResult[],
  scopeFilter: { userId: string; organizationId: string | null }
): Promise<{ matched: number; created: number; errors: number }> {
  let matched = 0
  let created = 0
  let errors = 0

  for (const result of results) {
    try {
      const existingId = await matchLinkedInToProspect(result, scopeFilter)

      if (existingId) {
        await enrichProspectWithLinkedIn(existingId, result)
        matched++
      } else {
        // Create from LinkedIn (less common, usually enrichment only)
        await prisma.prospect.create({
          data: {
            companyName: result.name,
            businessType: result.industry || null,
            website: result.website || null,
            companyLinkedIn: result.url,
            employeeCount: result.employeeCount || null,
            dataSource: 'linkedin',
            dateCollected: new Date(),
            enrichmentSources: ['linkedin'],
            enrichedAt: new Date(),
            userId: scopeFilter.userId,
            organizationId: scopeFilter.organizationId,
          },
        })
        created++
      }
    } catch (error) {
      console.error('Error processing LinkedIn result:', error)
      errors++
    }
  }

  return { matched, created, errors }
}



