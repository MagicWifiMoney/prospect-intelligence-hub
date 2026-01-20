export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getDataScope, buildProspectWhereClause } from '@/lib/data-isolation'
import { apiErrorResponse, unauthorizedResponse, validationErrorResponse } from '@/lib/api-error'
import { sendEmail, isResendConfigured, replaceTemplateVariables } from '@/lib/resend'
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

// Generate email content for a prospect
async function generateEmailContent(
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
    phone: string | null
    email: string | null
  },
  offer?: {
    name: string
    price: string | null
    features: string[]
    emailSubject: string
    emailBody: string
  } | null
): Promise<{ subject: string; body: string }> {
  // If offer has email templates, use those with variable replacement
  if (offer && offer.emailSubject && offer.emailBody) {
    const subject = replaceTemplateVariables(offer.emailSubject, prospect)
    const body = replaceTemplateVariables(offer.emailBody, prospect)
    return { subject, body }
  }

  // Use AI generation
  const geminiApiKey = process.env.GEMINI_API_KEY
  if (!geminiApiKey) {
    return getFallbackEmail(prospect, offer)
  }

  let painPoints: string[] = []
  try {
    if (prospect.painPoints) {
      painPoints = JSON.parse(prospect.painPoints)
    }
  } catch {
    // Ignore
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

Generate a personalized cold email:
1. SUBJECT: Compelling, under 60 chars, no spam words
2. BODY:
   - Personalized opening referencing their specific business
   - ${offer ? `Naturally introduce the ${offer.name} offer and its key benefits` : 'Clear value proposition'}
   - Soft CTA suggesting a 15-minute call
   - Keep under 150 words total
   - Do NOT include a signature line

Return ONLY valid JSON: {"subject": "...", "body": "..."}`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
        }),
      }
    )

    if (!response.ok) {
      return getFallbackEmail(prospect, offer)
    }

    const data = await response.json()
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const emailContent = JSON.parse(jsonMatch[0])
      if (emailContent.subject && emailContent.body) {
        return { subject: emailContent.subject, body: emailContent.body }
      }
    }
    return getFallbackEmail(prospect, offer)
  } catch {
    return getFallbackEmail(prospect, offer)
  }
}

/**
 * POST /api/outreach/send
 * Send batch emails to prospects
 *
 * Body options:
 * - prospectIds: string[] - Specific prospects to email
 * - segmentId: string - Send to all prospects in a segment with email
 * - maxSend: number - Maximum emails to send (safety limit, default 50)
 * - delayMs: number - Delay between sends in ms (default 1000)
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

    // Check Resend is configured
    if (!isResendConfigured()) {
      return validationErrorResponse('Email not configured. Please add RESEND_API_KEY to environment.')
    }

    const body = await request.json()
    const { prospectIds, segmentId, maxSend = 50, delayMs = 1000 } = body

    if (!prospectIds && !segmentId) {
      return validationErrorResponse('Either prospectIds or segmentId is required')
    }

    let segment = null
    let offer = null
    let prospectsToEmail: {
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
      phone: string | null
    }[] = []

    // Get segment and offer if segmentId provided
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

      // Get prospects matching segment rules with email
      const rules = segment.rules as SegmentRules
      const ruleWhere = buildPrismaWhereFromRules(rules)

      prospectsToEmail = await prisma.prospect.findMany({
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
          phone: true,
        },
        take: maxSend,
        orderBy: { leadScore: 'desc' },
      })
    } else if (prospectIds && Array.isArray(prospectIds)) {
      prospectsToEmail = await prisma.prospect.findMany({
        where: {
          id: { in: prospectIds.slice(0, maxSend) },
          ...buildProspectWhereClause(scope),
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
          phone: true,
        },
      })
    }

    if (prospectsToEmail.length === 0) {
      return validationErrorResponse('No prospects found with email addresses')
    }

    // Send emails with delay between each
    const results: {
      prospectId: string
      companyName: string
      recipientEmail: string
      success: boolean
      messageId?: string
      error?: string
    }[] = []

    for (let i = 0; i < prospectsToEmail.length; i++) {
      const prospect = prospectsToEmail[i]
      const recipientEmail = prospect.ownerEmail || prospect.email

      if (!recipientEmail) {
        results.push({
          prospectId: prospect.id,
          companyName: prospect.companyName,
          recipientEmail: '',
          success: false,
          error: 'No email address',
        })
        continue
      }

      try {
        // Generate email content
        const { subject, body: emailBody } = await generateEmailContent(prospect, offer)

        // Send via Resend
        const result = await sendEmail({
          to: recipientEmail,
          subject,
          html: emailBody.replace(/\n/g, '<br>'),
        })

        if (!result.success) {
          throw new Error(result.error || 'Failed to send')
        }

        // Record in SentEmail table
        await prisma.sentEmail.create({
          data: {
            prospectId: prospect.id,
            subject,
            body: emailBody,
            gmailMsgId: result.messageId || null,
            threadId: null,
            status: 'sent',
          },
        })

        // Update prospect
        await prisma.prospect.update({
          where: { id: prospect.id },
          data: {
            contactedAt: new Date(),
            lastEmailSentAt: new Date(),
            emailCount: { increment: 1 },
          },
        })

        // Log activity
        await prisma.prospectActivity.create({
          data: {
            prospectId: prospect.id,
            activityType: 'email_sent',
            content: `Batch email sent: ${subject}`,
            metadata: JSON.stringify({
              messageId: result.messageId,
              segmentId: segment?.id,
              offerId: offer?.id,
            }),
            createdBy: session.user?.email || 'system',
          },
        })

        results.push({
          prospectId: prospect.id,
          companyName: prospect.companyName,
          recipientEmail,
          success: true,
          messageId: result.messageId,
        })
      } catch (error) {
        console.error(`Failed to send email to ${recipientEmail}:`, error)
        results.push({
          prospectId: prospect.id,
          companyName: prospect.companyName,
          recipientEmail,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }

      // Delay before next send (except for last one)
      if (i < prospectsToEmail.length - 1 && delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }

    const successCount = results.filter((r) => r.success).length
    const failCount = results.filter((r) => !r.success).length

    return NextResponse.json({
      success: true,
      totalSent: successCount,
      totalFailed: failCount,
      results,
      segment: segment ? { id: segment.id, name: segment.name } : null,
      offer: offer ? { id: offer.id, name: offer.name } : null,
    })
  } catch (error) {
    return apiErrorResponse(error, 'POST /api/outreach/send', 'Failed to send batch emails')
  }
}
