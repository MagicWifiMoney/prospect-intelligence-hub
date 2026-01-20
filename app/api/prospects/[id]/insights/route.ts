
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getDataScope, buildProspectWhereClause } from '@/lib/data-isolation'
import { apiErrorResponse, notFoundResponse, unauthorizedResponse } from '@/lib/api-error'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return unauthorizedResponse()
    }

    // Get user's data scope for filtering
    const scope = await getDataScope()
    if (!scope) {
      return unauthorizedResponse()
    }

    const prospectId = params.id

    // Fetch prospect data with data isolation
    const prospect = await prisma.prospect.findFirst({
      where: {
        id: prospectId,
        ...buildProspectWhereClause(scope),
      },
      include: {
        reviews: {
          take: 10,
          orderBy: { publishedAt: 'desc' }
        }
      }
    })

    if (!prospect) {
      return notFoundResponse('Prospect')
    }

    // Read Gemini API key from environment
    const geminiApiKey = process.env.GEMINI_API_KEY

    if (!geminiApiKey) {
      return NextResponse.json({
        error: 'Gemini API key not configured. Please add GEMINI_API_KEY to your environment variables.'
      }, { status: 400 })
    }

    // Prepare review text
    const reviewTexts = prospect.reviews
      .filter(r => r.text)
      .map(r => `Rating: ${r.rating}/5 - "${r.text}"`)
      .join('\n')

    // Build prompt for AI analysis
    const prompt = `Analyze this contractor/service business as a sales prospect:

Business: ${prospect.companyName}
Type: ${prospect.businessType || 'Unknown'}
Location: ${prospect.city || 'Unknown'}, Minnesota
Google Rating: ${prospect.googleRating || 'N/A'}/5.0 (${prospect.reviewCount || 0} reviews)
Website: ${prospect.website || 'None'}
Phone: ${prospect.phone || 'None'}

Recent Reviews:
${reviewTexts || 'No reviews available'}

Please provide:
1. OUTREACH STRATEGY (2-3 sentences): Best approach to reach out, when to contact, what channel to use
2. PAIN POINTS (3-5 bullet points): Key problems this business likely faces based on their reviews and profile
3. VALUE PROPOSITION (2-3 sentences): How our services can specifically help them
4. SENTIMENT SUMMARY (1 sentence): Overall customer sentiment from reviews
5. COMPETITIVE GAPS (2-3 bullet points): Services or capabilities they seem to be missing

Format as JSON with keys: outreachStrategy, painPoints (array), valueProposition, sentimentSummary, competitiveGaps (array)`

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          }
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', errorText)
      return NextResponse.json({
        error: 'AI analysis failed'
      }, { status: 500 })
    }

    const data = await response.json()
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Parse AI response (try to extract JSON, fallback to raw text)
    let insights
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        insights = JSON.parse(jsonMatch[0])
      } else {
        // Fallback parsing
        insights = {
          outreachStrategy: aiResponse.substring(0, 200),
          painPoints: ['Analysis generated - see full details'],
          valueProposition: 'Custom solution recommended',
          sentimentSummary: 'Analysis in progress',
          competitiveGaps: ['See detailed analysis']
        }
      }
    } catch {
      insights = {
        outreachStrategy: aiResponse.substring(0, 200),
        painPoints: ['Manual review recommended'],
        valueProposition: 'Custom approach needed',
        sentimentSummary: 'Complex analysis',
        competitiveGaps: ['See full report']
      }
    }

    // Update prospect with insights
    await prisma.prospect.update({
      where: { id: prospectId },
      data: {
        outreachStrategy: insights.outreachStrategy,
        painPoints: JSON.stringify(insights.painPoints),
        aiRecommendations: insights.valueProposition,
        lastAnalyzed: new Date()
      }
    })

    // Log activity
    await prisma.prospectActivity.create({
      data: {
        prospectId,
        activityType: 'ai_analysis',
        content: 'AI insights generated',
        metadata: JSON.stringify({ insights }),
        createdBy: session.user?.email || 'system'
      }
    })

    return NextResponse.json({
      success: true,
      insights: {
        ...insights,
        rawResponse: aiResponse
      }
    })

  } catch (error) {
    return apiErrorResponse(error, 'POST /api/prospects/[id]/insights', 'Failed to generate insights')
  }
}
