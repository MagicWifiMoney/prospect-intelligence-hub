export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getDataScope, buildProspectWhereClause } from '@/lib/data-isolation'
import { apiErrorResponse, unauthorizedResponse, validationErrorResponse } from '@/lib/api-error'
import { replaceTemplateVariables } from '@/lib/gmail'
import { buildPrismaWhereFromRules, SegmentRules } from '@/lib/icp-rules'

// Fallback email when no template and AI fails
function getFallbackEmail(
  prospect: {
    companyName: string | null
    ownerName: string | null
    city: string | null
    googleRating: number | null
    businessType: string | null
  },
  offer?: { name: string; price: string | null } | null
): { subject: string; body: string } {
  const ownerName = prospect.ownerName || 'there'
  const companyName = prospect.companyName || 'your company'
  const city = prospect.city || 'your area'
  const googleRating = prospect.googleRating || 'great'
  const businessType = prospect.businessType || 'local'

  const offerText = offer
    ? `I specialize in ${offer.name}${offer.price ? ` (${offer.price})` : ''} and would love to help you.`
    : 'I help businesses like yours grow through proven marketing strategies.'

  return {
    subject: `Quick question about ${companyName}'s growth`,
    body: `Hi ${ownerName},

I came across ${companyName} and was impressed by your reputation in ${city} - ${googleRating} stars speaks for itself.

${offerText} I noticed a few opportunities that could help you attract more of the right customers.

Would you be open to a 15-minute call this week?

Best regards`
  }
}

// Generate AI email with offer context
async function generateAIEmail(
  prospect: {
    companyName: string | null
    ownerName: string | null
    city: string | null
    googleRating: number | null
    reviewCount: number | null
    businessType: string | null
    website: string | null
    painPoints: string | null
    outreachStrategy: string | null
  },
  offer?: {
    name: string
    price: string | null
    features: string[]
    emailSubject: string
    emailBody: string
  } | null
): Promise<{ subject: string; body: string; usedFallback: boolean }> {
  const geminiApiKey = process.env.GEMINI_API_KEY

  // If offer has email templates, use those with variable replacement
  if (offer && offer.emailSubject && offer.emailBody) {
    const subject = replaceTemplateVariables(offer.emailSubject, prospect)
    const body = replaceTemplateVariables(offer.emailBody, prospect)
    return { subject, body, usedFallback: false }
  }

  // If no Gemini API key, use fallback
  if (!geminiApiKey) {
    const fallback = getFallbackEmail(prospect, offer)
    return { ...fallback, usedFallback: true }
  }

  // Generate with AI
  let painPoints: string[] = []
  try {
    if (prospect.painPoints) {
      painPoints = JSON.parse(prospect.painPoints)
    }
  } catch {
    // Ignore parsing errors
  }

  const offerContext = offer
    ? `
OFFER TO PROMOTE:
- Service: ${offer.name}
- Price: ${offer.price || 'Custom pricing'}
- Key Benefits: ${offer.features.join(', ') || 'Tailored solutions'}
`
    : ''

  const prompt = `You are a professional sales rep writing a cold outreach email.

PROSPECT DATA:
- Company: ${prospect.companyName}
- Contact: ${prospect.ownerName || 'Unknown'}
- Business Type: ${prospect.businessType || 'Local business'}
- Location: ${prospect.city || 'Unknown'}
- Rating: ${prospect.googleRating || 'N/A'}/5 (${prospect.reviewCount || 0} reviews)
- Website: ${prospect.website || 'None'}
${offerContext}
INSIGHTS:
- Pain Points: ${painPoints.length > 0 ? painPoints.join('; ') : 'No specific pain points identified'}
- Outreach Strategy: ${prospect.outreachStrategy || 'General outreach approach'}

Generate a personalized cold email:
1. SUBJECT: Compelling, under 60 chars, no spam words
2. BODY:
   - Personalized opening referencing their specific business
   - If they have good reviews (4+ stars), reference their strong reputation
   - If pain points are available, naturally weave 1-2 into the email
   - ${offer ? `Naturally introduce the ${offer.name} offer and its key benefits` : 'Clear value proposition about how you can help them grow'}
   - Soft CTA suggesting a 15-minute call
   - Keep under 150 words total
   - Professional but friendly tone
   - Do NOT include a signature line (just end after the CTA)

IMPORTANT: Return ONLY valid JSON with exactly this format:
{"subject": "Your subject line here", "body": "Your email body here"}

Do not include any markdown formatting, code blocks, or explanation text.`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 512,
          },
        }),
      }
    )

    if (!response.ok) {
      console.error('Gemini API error:', await response.text())
      const fallback = getFallbackEmail(prospect, offer)
      return { ...fallback, usedFallback: true }
    }

    const data = await response.json()
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const emailContent = JSON.parse(jsonMatch[0])
      if (emailContent.subject && emailContent.body) {
        return { subject: emailContent.subject, body: emailContent.body, usedFallback: false }
      }
    }

    // Fallback on parse error
    const fallback = getFallbackEmail(prospect, offer)
    return { ...fallback, usedFallback: true }
  } catch (error) {
    console.error('AI email generation error:', error)
    const fallback = getFallbackEmail(prospect, offer)
    return { ...fallback, usedFallback: true }
  }
}

/**
 * POST /api/outreach/preview
 * Generate preview emails for selected prospects or a segment
 *
 * Body options:
 * - prospectIds: string[] - Specific prospects to preview
 * - segmentId: string - Preview emails for prospects in a segment
 * - limit: number - Max number of previews to generate (default 5)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return unauthorizedResponse()
    }

    const scope = await getDataScope()
    if (!scope) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const { prospectIds, segmentId, limit = 5 } = body

    if (!prospectIds && !segmentId) {
      return validationErrorResponse('Either prospectIds or segmentId is required')
    }

    let segment = null
    let offer: {
      id: string
      name: string
      price: string | null
      features: string[]
      emailSubject: string
      emailBody: string
    } | null = null
    let prospectsToPreview: {
      id: string
      companyName: string
      businessType: string | null
      city: string | null
      googleRating: number | null
      reviewCount: number | null
      website: string | null
      email: string | null
      ownerEmail: string | null
      ownerName: string | null
      painPoints: string | null
      outreachStrategy: string | null
    }[] = []

    // If segmentId provided, get segment with offer
    if (segmentId) {
      segment = await prisma.icpSegment.findFirst({
        where: {
          id: segmentId,
          userId: scope.userId,
        },
        include: {
          offerTemplate: true,
        },
      })

      if (!segment) {
        return validationErrorResponse('Segment not found')
      }

      offer = segment.offerTemplate

      // Get prospects matching segment rules
      const rules = segment.rules as SegmentRules
      const ruleWhere = buildPrismaWhereFromRules(rules)

      prospectsToPreview = await prisma.prospect.findMany({
        where: {
          ...buildProspectWhereClause(scope),
          ...ruleWhere,
          OR: [{ email: { not: null } }, { ownerEmail: { not: null } }],
        },
        select: {
          id: true,
          companyName: true,
          businessType: true,
          city: true,
          googleRating: true,
          reviewCount: true,
          website: true,
          email: true,
          ownerEmail: true,
          ownerName: true,
          painPoints: true,
          outreachStrategy: true,
        },
        take: Math.min(limit, 20),
        orderBy: { leadScore: 'desc' },
      })
    } else if (prospectIds && Array.isArray(prospectIds)) {
      // Get specific prospects
      prospectsToPreview = await prisma.prospect.findMany({
        where: {
          id: { in: prospectIds },
          ...buildProspectWhereClause(scope),
        },
        select: {
          id: true,
          companyName: true,
          businessType: true,
          city: true,
          googleRating: true,
          reviewCount: true,
          website: true,
          email: true,
          ownerEmail: true,
          ownerName: true,
          painPoints: true,
          outreachStrategy: true,
        },
        take: Math.min(prospectIds.length, 20),
      })
    }

    // Generate preview emails
    const previews = await Promise.all(
      prospectsToPreview.map(async (prospect) => {
        const recipientEmail = prospect.ownerEmail || prospect.email

        const { subject, body: emailBody, usedFallback } = await generateAIEmail(prospect, offer)

        return {
          prospectId: prospect.id,
          companyName: prospect.companyName,
          recipientEmail,
          subject,
          body: emailBody,
          usedFallback,
        }
      })
    )

    // Get total count of prospects that would be emailed
    let totalCount = prospectsToPreview.length
    if (segmentId && segment) {
      const rules = segment.rules as SegmentRules
      const ruleWhere = buildPrismaWhereFromRules(rules)
      totalCount = await prisma.prospect.count({
        where: {
          ...buildProspectWhereClause(scope),
          ...ruleWhere,
          OR: [{ email: { not: null } }, { ownerEmail: { not: null } }],
        },
      })
    }

    return NextResponse.json({
      previews,
      totalCount,
      segment: segment
        ? {
            id: segment.id,
            name: segment.name,
            color: segment.color,
          }
        : null,
      offer: offer
        ? {
            id: offer.id,
            name: offer.name,
            price: offer.price,
          }
        : null,
    })
  } catch (error) {
    return apiErrorResponse(error, 'POST /api/outreach/preview', 'Failed to generate email previews')
  }
}
