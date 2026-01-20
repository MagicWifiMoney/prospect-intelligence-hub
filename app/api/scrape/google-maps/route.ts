import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { apiErrorResponse, unauthorizedResponse } from '@/lib/api-error'
import {
  scrapeGoogleMaps,
  scrapeMultipleSearches,
  createScrapeJob,
  MN_CITIES,
  SERVICE_CATEGORIES,
} from '@/lib/apify'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const { mode, categories, cities, customSearch, maxResults } = body

    let apifyRun
    let searchQuery = ''

    if (mode === 'custom' && customSearch) {
      // Single custom search
      searchQuery = customSearch
      apifyRun = await scrapeGoogleMaps(customSearch, maxResults || 100)
    } else if (mode === 'bulk') {
      // Bulk scrape with selected categories and cities
      const selectedCategories = categories?.length > 0 ? categories : SERVICE_CATEGORIES.slice(0, 5)
      const selectedCities = cities?.length > 0 ? cities : MN_CITIES.slice(0, 5)

      searchQuery = `${selectedCategories.length} categories x ${selectedCities.length} cities`
      apifyRun = await scrapeMultipleSearches(
        selectedCategories,
        selectedCities,
        maxResults || 30
      )
    } else {
      // Quick scrape - top 3 categories, top 5 cities
      const quickCategories = ['plumber', 'hvac contractor', 'roofing contractor']
      const quickCities = MN_CITIES.slice(0, 5)

      searchQuery = 'Quick scrape: plumber, hvac, roofing in top 5 MN cities'
      apifyRun = await scrapeMultipleSearches(quickCategories, quickCities, 20)
    }

    // Create job record
    const jobId = await createScrapeJob(
      searchQuery,
      apifyRun.id,
      categories || [],
      cities || []
    )

    return NextResponse.json({
      success: true,
      jobId,
      apifyRunId: apifyRun.id,
      datasetId: apifyRun.datasetId,
      status: apifyRun.status,
      message: 'Scrape started successfully. Check status for updates.',
    })
  } catch (error) {
    return apiErrorResponse(error, 'POST /api/scrape/google-maps', 'Failed to start scrape')
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return unauthorizedResponse()
    }

    // Return available categories and cities
    return NextResponse.json({
      categories: SERVICE_CATEGORIES,
      cities: MN_CITIES,
    })
  } catch (error) {
    return apiErrorResponse(error, 'GET /api/scrape/google-maps', 'Failed to get options')
  }
}
