import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getDataScope, buildProspectWhereClause } from '@/lib/data-isolation'
import { apiErrorResponse, notFoundResponse, unauthorizedResponse } from '@/lib/api-error'

// Fallback template when AI fails
function getFallbackEmail(prospect: any): { subject: string; body: string } {
  const ownerName = prospect.ownerName || 'there'
  const companyName = prospect.companyName || 'your company'
  const city = prospect.city || 'your area'
  const googleRating = prospect.googleRating || 'great'
  const businessType = prospect.businessType || 'local'

  return {
    subject: `Quick question about ${companyName}'s growth`,
    body: `Hi ${ownerName},

I came across ${companyName} and was impressed by your reputation in ${city} - ${googleRating} stars speaks for itself.

I help ${businessType} businesses grow through proven marketing strategies. I noticed a few opportunities that could help you attract more of the right customers.

Would you be open to a 15-minute call this week?

Best regards`
  }
}

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
          take: 5,
          orderBy: { publishedAt: 'desc' }
        }
      }
    })

    if (!prospect) {
      return notFoundResponse('Prospect')
    }

    // Determine recipient email
    const recipientEmail = prospect.ownerEmail || prospect.email
    if (!recipientEmail) {
      return NextResponse.json({
        error: 'Prospect has no email address'
      }, { status: 400 })
    }

    // Read Gemini API key from environment
    const geminiApiKey = process.env.GEMINI_API_KEY

    if (!geminiApiKey) {
      // Return fallback if no API key
      const fallback = getFallbackEmail(prospect)
      return NextResponse.json({
        subject: fallback.subject,
        body: fallback.body,
        recipientEmail,
        usedFallback: true
      })
    }

    // Parse pain points if available
    let painPoints: string[] = []
    try {
      if (prospect.painPoints) {
        painPoints = JSON.parse(prospect.painPoints)
      }
    } catch {
      // Ignore parsing errors
    }

    // Extract positive review snippets for personalization
    const positiveReviews = prospect.reviews
      .filter(r => r.rating && r.rating >= 4 && r.text)
      .slice(0, 2)
      .map(r => `"${r.text?.substring(0, 100)}..."`)
      .join(' ')

    // Build AI prompt
    const prompt = `You are a professional sales rep writing a cold outreach email.

PROSPECT DATA:
- Company: ${prospect.companyName}
- Contact: ${prospect.ownerName || 'Unknown'}
- Business Type: ${prospect.businessType || 'Local business'}
- Location: ${prospect.city || 'Unknown'}
- Rating: ${prospect.googleRating || 'N/A'}/5 (${prospect.reviewCount || 0} reviews)
- Website: ${prospect.website || 'None'}

INSIGHTS:
- Pain Points: ${painPoints.length > 0 ? painPoints.join('; ') : 'No specific pain points identified'}
- Outreach Strategy: ${prospect.outreachStrategy || 'General outreach approach'}
${positiveReviews ? `- Positive Review Highlights: ${positiveReviews}` : ''}

Generate a personalized cold email:
1. SUBJECT: Compelling, under 60 chars, no spam words
2. BODY:
   - Personalized opening referencing their specific business
   - If they have good reviews (4+ stars), reference their strong reputation
   - If pain points are available, naturally weave 1-2 into the email
   - Clear value proposition about how you can help them grow
   - Soft CTA suggesting a 15-minute call
   - Keep under 150 words total
   - Professional but friendly tone
   - Do NOT include a signature line (just end after the CTA)

IMPORTANT: Return ONLY valid JSON with exactly this format:
{"subject": "Your subject line here", "body": "Your email body here"}

Do not include any markdown formatting, code blocks, or explanation text.`

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
            maxOutputTokens: 512,
          }
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', errorText)
      // Return fallback on API error
      const fallback = getFallbackEmail(prospect)
      return NextResponse.json({
        subject: fallback.subject,
        body: fallback.body,
        recipientEmail,
        usedFallback: true
      })
    }

    const data = await response.json()
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Parse AI response
    let emailContent: { subject: string; body: string }
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        emailContent = JSON.parse(jsonMatch[0])

        // Validate the response has required fields
        if (!emailContent.subject || !emailContent.body) {
          throw new Error('Missing required fields')
        }
      } else {
        throw new Error('No JSON found in response')
      }
    } catch {
      console.error('Failed to parse AI response:', aiResponse)
      // Return fallback on parse error
      const fallback = getFallbackEmail(prospect)
      return NextResponse.json({
        subject: fallback.subject,
        body: fallback.body,
        recipientEmail,
        usedFallback: true
      })
    }

    // Log activity
    await prisma.prospectActivity.create({
      data: {
        prospectId,
        activityType: 'email_generated',
        content: 'Outreach email generated via AI',
        metadata: JSON.stringify({ subject: emailContent.subject }),
        createdBy: session.user?.email || 'system'
      }
    })

    return NextResponse.json({
      subject: emailContent.subject,
      body: emailContent.body,
      recipientEmail,
      usedFallback: false
    })

  } catch (error) {
    return apiErrorResponse(error, 'POST /api/prospects/[id]/generate-email', 'Failed to generate email')
  }
}
