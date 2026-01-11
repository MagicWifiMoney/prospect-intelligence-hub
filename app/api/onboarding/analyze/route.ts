import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

interface AnalysisResult {
  businessName: string
  industry: string
  services: string[]
  targetMarket: string
  location: string
  suggestedIndustries: string[]
  suggestedCities: string[]
  confidence: number
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

    // Use Gemini to analyze the website
    const prompt = `Analyze this business website URL and extract information about the business.

URL: ${validUrl.toString()}

Based on the URL and domain name, provide your best analysis of:
1. The likely business name (from domain)
2. The industry/niche they operate in
3. Services they likely offer
4. Their target market (B2B, B2C, local, national)
5. Their likely geographic focus

Also suggest:
- 3-5 related industries they might want to monitor for leads
- 5-10 cities in Minnesota they might target (if they're a local service business)

Respond in this exact JSON format:
{
  "businessName": "extracted or guessed business name",
  "industry": "main industry category",
  "services": ["service1", "service2", "service3"],
  "targetMarket": "B2B" | "B2C" | "Both",
  "location": "guessed location or 'Unknown'",
  "suggestedIndustries": ["industry1", "industry2", "industry3"],
  "suggestedCities": ["Minneapolis", "St Paul", "Bloomington", "Plymouth", "Edina"],
  "confidence": 0.0-1.0
}

If you cannot determine something, make a reasonable guess based on common patterns. Always return valid JSON.`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1024,
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
