export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getDataScope, buildProspectWhereClause } from '@/lib/data-isolation'
import { sendEmail, replaceTemplateVariables, isResendConfigured } from '@/lib/resend'

/**
 * POST: Send an email to a prospect
 * Body: { prospectId, templateId?, subject?, body? }
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get data scope for isolation
        const scope = await getDataScope()
        if (!scope) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, name: true },
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Check Resend is configured
        if (!isResendConfigured()) {
            return NextResponse.json(
                { error: 'Email not configured. Please add RESEND_API_KEY to environment.' },
                { status: 400 }
            )
        }

        const body = await request.json()
        const { prospectId, templateId, subject: customSubject, body: customBody } = body

        if (!prospectId) {
            return NextResponse.json({ error: 'prospectId is required' }, { status: 400 })
        }

        // Get prospect WITH DATA ISOLATION - critical security check
        const prospect = await prisma.prospect.findFirst({
            where: {
                id: prospectId,
                ...buildProspectWhereClause(scope),
            },
            select: {
                id: true,
                email: true,
                ownerEmail: true,
                companyName: true,
                ownerName: true,
                googleRating: true,
                reviewCount: true,
                businessType: true,
                city: true,
                website: true,
                phone: true,
            },
        })

        if (!prospect) {
            return NextResponse.json({ error: 'Prospect not found' }, { status: 404 })
        }

        // Determine recipient email
        const recipientEmail = prospect.ownerEmail || prospect.email
        if (!recipientEmail) {
            return NextResponse.json(
                { error: 'Prospect has no email address' },
                { status: 400 }
            )
        }

        // Get subject and body (from template or custom)
        let emailSubject = customSubject
        let emailBody = customBody

        if (templateId) {
            const template = await prisma.emailTemplate.findUnique({
                where: { id: templateId },
            })

            if (template) {
                emailSubject = emailSubject || template.subject
                emailBody = emailBody || template.body

                // Increment usage count
                await prisma.emailTemplate.update({
                    where: { id: templateId },
                    data: { usageCount: { increment: 1 } },
                })
            }
        }

        if (!emailSubject || !emailBody) {
            return NextResponse.json(
                { error: 'subject and body are required (or provide templateId)' },
                { status: 400 }
            )
        }

        // Replace template variables
        emailSubject = replaceTemplateVariables(emailSubject, prospect)
        emailBody = replaceTemplateVariables(emailBody, prospect)

        // Send the email via Resend
        const result = await sendEmail({
            to: recipientEmail,
            subject: emailSubject,
            html: emailBody.replace(/\n/g, '<br>'), // Convert newlines to HTML
        })

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Failed to send email' },
                { status: 500 }
            )
        }

        // Record the sent email
        const sentEmail = await prisma.sentEmail.create({
            data: {
                prospectId: prospect.id,
                templateId: templateId || null,
                subject: emailSubject,
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
                emailCount: { increment: 1 },
                lastEmailSentAt: new Date(),
            },
        })

        return NextResponse.json({
            success: true,
            sentEmail: {
                id: sentEmail.id,
                messageId: result.messageId,
            },
        })

    } catch (error) {
        console.error('Error sending email:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to send email' },
            { status: 500 }
        )
    }
}
