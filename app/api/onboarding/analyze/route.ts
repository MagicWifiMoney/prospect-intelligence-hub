import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const BRAVE_API_KEY = process.env.BRAVE_API_KEY

interface AnalysisResult {
  businessName: string
  industry: string
  services: string[]
  targetMarket: string
  location: string
  suggestedIndustries: string[]
  suggestedCities: string[]
  confidence: number
  operationsSummary: string
  icpDescription: string
  icpPainPoints: string[]
  industryPainPoints: string[]
}

// Fetch website context using Brave Search API
async function fetchWebsiteContext(url: string): Promise<string> {
  if (!BRAVE_API_KEY) {
    console.log('Brave API key not configured, skipping web search')
    return ''
  }

  try {
    const searchQuery = `site:${new URL(url).hostname} about services`
    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(searchQuery)}&count=5`,
      {
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': BRAVE_API_KEY
        }
      }
    )

    if (!response.ok) {
      console.error('Brave search failed:', response.status)
      return ''
    }

    const data = await response.json()
    const results = data.web?.results || []

    // Compile search results into context
    const context = results.map((r: { title?: string; description?: string; url?: string }) =>
      `Title: ${r.title}\nDescription: ${r.description}\nURL: ${r.url}`
    ).join('\n\n')

    return context
  } catch (error) {
    console.error('Error fetching website context:', error)
    return ''
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Validate URL format
    let validUrl: URL
    try {
      validUrl = new URL(url.startsWith('http') ? url : `https://${url}`)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API not configured' }, { status: 500 })
    }

    // Fetch actual website context using Brave Search
    const websiteContext = await fetchWebsiteContext(validUrl.toString())

    // Build the prompt with real website context if available
    const contextSection = websiteContext
      ? `\n\nHere is actual content found from this website:\n${websiteContext}\n\nUse this real information to provide accurate analysis.`
      : ''

    const prompt = `Analyze this business website and extract comprehensive information about the business.

URL: ${validUrl.toString()}
${contextSection}

Based on the URL${websiteContext ? ' and the website content provided above' : ' and domain name'}, provide your best analysis of:
1. The business name
2. The industry/niche they operate in (be specific - e.g., "Chiropractic Care" not just "Healthcare")
3. Services they offer
4. Their target market (B2B, B2C, local, national)
5. Their likely geographic focus
6. A brief summary of their operations (what they do day-to-day)
7. Their Ideal Customer Profile (ICP) - who are the people that would seek out this business? Be specific about demographics and needs.
8. Common pain points their ICP experiences BEFORE finding this business (what problems drive them to seek this service?)
9. Industry-specific challenges and pain points they face as a business

Also suggest:
- 3-5 related industries that might refer customers to this business
- 5-10 cities in Minnesota they might serve (if local)

IMPORTANT: For ICP, focus on the END CUSTOMERS who would use this business's services, not other businesses. For example:
- A chiropractor's ICP would be "People experiencing back pain, neck pain, or seeking preventive spinal care"
- A marketing agency's ICP would be "Small business owners looking to grow their online presence"

Respond in this exact JSON format:
{
  "businessName": "extracted business name",
  "industry": "specific industry category",
  "services": ["service1", "service2", "service3"],
  "targetMarket": "B2B" | "B2C" | "Both",
  "location": "city, state or 'Unknown'",
  "operationsSummary": "Brief 1-2 sentence summary of what this business does",
  "icpDescription": "Specific description of their ideal customer (the end user who buys their services)",
  "icpPainPoints": ["specific pain point 1", "specific pain point 2", "specific pain point 3"],
  "industryPainPoints": ["business challenge 1", "business challenge 2", "business challenge 3"],
  "suggestedIndustries": ["industry1", "industry2", "industry3"],
  "suggestedCities": ["Minneapolis", "St Paul", "Bloomington", "Plymouth", "Edina"],
  "confidence": 0.0-1.0
}

Always return valid JSON.`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1500,
          },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', errorText)
      return NextResponse.json({ error: 'AI analysis failed' }, { status: 500 })
    }

    const data = await response.json()
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Extract JSON from response
    let analysis: AnalysisResult
    try {
      // Try to find JSON in the response
      const jsonMatch = textContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', textContent)
      // Return default analysis based on URL
      const domain = validUrl.hostname.replace('www.', '').split('.')[0]
      analysis = {
        businessName: domain.charAt(0).toUpperCase() + domain.slice(1),
        industry: 'General Services',
        services: ['Consulting', 'Professional Services'],
        targetMarket: 'B2B',
        location: 'Minnesota',
        operationsSummary: 'A professional services business serving clients in their local area.',
        icpDescription: 'Local businesses and homeowners looking for reliable service providers.',
        icpPainPoints: ['Finding trustworthy contractors', 'Getting timely responses', 'Fair pricing'],
        industryPainPoints: ['Lead generation', 'Standing out from competition', 'Building online presence'],
        suggestedIndustries: [
          'Plumbing',
          'HVAC',
          'Roofing',
          'Electrical',
          'Landscaping',
        ],
        suggestedCities: [
          'Minneapolis',
          'St Paul',
          'Bloomington',
          'Plymouth',
          'Edina',
          'Maple Grove',
          'Eden Prairie',
          'Woodbury',
        ],
        confidence: 0.3,
      }
    }

    // Ensure all required fields exist with defaults
    const result: AnalysisResult = {
      businessName: analysis.businessName || 'Your Business',
      industry: analysis.industry || 'General Services',
      services: analysis.services || [],
      targetMarket: analysis.targetMarket || 'B2B',
      location: analysis.location || 'Minnesota',
      operationsSummary: analysis.operationsSummary || 'A professional services business.',
      icpDescription: analysis.icpDescription || 'Local businesses and homeowners.',
      icpPainPoints: analysis.icpPainPoints || ['Finding reliable services', 'Fair pricing', 'Timely responses'],
      industryPainPoints: analysis.industryPainPoints || ['Lead generation', 'Competition', 'Online presence'],
      suggestedIndustries: analysis.suggestedIndustries || [
        'Plumbing',
        'HVAC',
        'Roofing',
        'Electrical',
        'Landscaping',
      ],
      suggestedCities: analysis.suggestedCities || [
        'Minneapolis',
        'St Paul',
        'Bloomington',
        'Plymouth',
        'Edina',
      ],
      confidence: analysis.confidence || 0.5,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Onboarding analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze website' },
      { status: 500 }
    )
  }
}
