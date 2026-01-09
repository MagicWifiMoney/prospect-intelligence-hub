
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prospectId = params.id

    // Get prospect data
    const prospect = await prisma.prospect.findUnique({
      where: { id: prospectId },
    })

    if (!prospect) {
      return NextResponse.json(
        { error: 'Prospect not found' },
        { status: 404 }
      )
    }

    // Create analysis prompt
    const analysisPrompt = `
    Analyze this business prospect and provide a comprehensive assessment:

    Company: ${prospect.companyName}
    Business Type: ${prospect.businessType || 'Unknown'}
    Location: ${prospect.city || 'Unknown'}
    Google Rating: ${prospect.googleRating || 'N/A'}
    Review Count: ${prospect.reviewCount || 0}
    Website: ${prospect.website ? 'Yes' : 'No'}
    Phone: ${prospect.phone ? 'Yes' : 'No'}
    Social Media: ${[prospect.facebook, prospect.instagram, prospect.linkedin].filter(Boolean).length > 0 ? 'Yes' : 'No'}

    Please analyze and provide:
    1. Lead Score (0-100): Overall quality and potential
    2. Sentiment Score (0-100): Based on available data quality
    3. Is Hot Lead (true/false): Ready for immediate outreach
    4. AI Recommendations: Specific action items for outreach
    5. Anomalies: Any red flags or issues detected

    Respond in JSON format:
    {
      "leadScore": number,
      "sentimentScore": number,
      "isHotLead": boolean,
      "aiRecommendations": "string",
      "anomaliesDetected": "string or null"
    }
    `

    // Call LLM API for analysis
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to analyze prospect')
    }

    const data = await response.json()
    const analysisResult = JSON.parse(data.choices[0].message.content)

    // Detect anomalies
    const anomalies = []
    
    // Check for personal phone numbers (simple heuristic)
    if (prospect.phone && (
      prospect.phone.includes('cell') || 
      prospect.phone.includes('mobile') ||
      prospect.phone.match(/\b\d{3}-\d{3}-\d{4}\b/) // Basic mobile pattern
    )) {
      anomalies.push('Potential personal phone number')
    }

    // Check for missing website
    if (!prospect.website) {
      anomalies.push('No website listed')
    }

    // Check for low review activity
    if ((prospect.reviewCount || 0) < 5 && prospect.googleRating) {
      anomalies.push('Low review activity')
    }

    const anomaliesText = anomalies.length > 0 ? anomalies.join(', ') : null

    // Update prospect with analysis results
    const updatedProspect = await prisma.prospect.update({
      where: { id: prospectId },
      data: {
        leadScore: analysisResult.leadScore,
        sentimentScore: analysisResult.sentimentScore,
        isHotLead: analysisResult.isHotLead,
        aiRecommendations: analysisResult.aiRecommendations,
        anomaliesDetected: anomaliesText || analysisResult.anomaliesDetected,
        lastAnalyzed: new Date(),
      },
    })

    return NextResponse.json({ 
      success: true,
      analysis: {
        leadScore: analysisResult.leadScore,
        sentimentScore: analysisResult.sentimentScore,
        isHotLead: analysisResult.isHotLead,
        aiRecommendations: analysisResult.aiRecommendations,
        anomaliesDetected: anomaliesText || analysisResult.anomaliesDetected,
      }
    })

  } catch (error) {
    console.error('Error analyzing prospect:', error)
    return NextResponse.json(
      { error: 'Failed to analyze prospect' },
      { status: 500 }
    )
  }
}
