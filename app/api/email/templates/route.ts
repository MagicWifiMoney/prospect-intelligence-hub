export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Default templates to seed on first access
const DEFAULT_TEMPLATES = [
    {
        name: 'Initial Outreach - SEO/Marketing',
        subject: 'Quick question about {{companyName}}\'s online presence',
        body: `Hi {{ownerName}},

I noticed {{companyName}} has excellent reviews ({{googleRating}} stars from {{reviewCount}} customers!) but I couldn't find your website when searching for "{{businessType}} in {{city}}".

Your competitors are showing up instead - and they don't have nearly as good reviews as you do.

Would you be open to a quick 10-minute call to discuss how we could help {{companyName}} show up first when people search for your services?

Best,
[Your Name]`,
        category: 'initial_outreach',
    },
    {
        name: 'Follow Up - No Response',
        subject: 'Re: Quick question about {{companyName}}',
        body: `Hi {{ownerName}},

Just wanted to follow up on my previous message. I know you're busy running {{companyName}}, so I'll keep this brief.

I help businesses like yours get more customers through Google. Given your strong reputation ({{googleRating}} stars!), I think there's a real opportunity here.

Would a quick 10-minute call work this week?

Best,
[Your Name]`,
        category: 'follow_up',
    },
    {
        name: 'Value Offer - Free Audit',
        subject: 'Free marketing audit for {{companyName}}',
        body: `Hi {{ownerName}},

I put together a quick marketing audit for {{companyName}} - completely free, no strings attached.

Here's what I found:
• Your Google rating ({{googleRating}}) is better than most {{businessType}} in {{city}}
• But you're not showing up in the local map pack
• Your competitors with worse reviews are getting the customers who should be calling you

I'd love to share the full audit with you. Worth a 10-minute call?

Best,
[Your Name]`,
        category: 'value_offer',
    },
]

/**
 * GET: List all email templates
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get templates
        let templates = await prisma.emailTemplate.findMany({
            orderBy: { createdAt: 'asc' },
        })

        // Seed defaults if none exist
        if (templates.length === 0) {
            await prisma.emailTemplate.createMany({
                data: DEFAULT_TEMPLATES,
            })
            templates = await prisma.emailTemplate.findMany({
                orderBy: { createdAt: 'asc' },
            })
        }

        return NextResponse.json({ templates })

    } catch (error) {
        console.error('Error fetching templates:', error)
        return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
    }
}

/**
 * POST: Create a new email template
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { name, subject, body: templateBody, category } = body

        if (!name || !subject || !templateBody) {
            return NextResponse.json(
                { error: 'name, subject, and body are required' },
                { status: 400 }
            )
        }

        const template = await prisma.emailTemplate.create({
            data: {
                name,
                subject,
                body: templateBody,
                category: category || 'custom',
            },
        })

        return NextResponse.json({ template })

    } catch (error) {
        console.error('Error creating template:', error)
        return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
    }
}
