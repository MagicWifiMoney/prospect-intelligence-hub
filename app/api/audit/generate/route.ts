import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { nanoid } from 'nanoid'
import { generateHeroImage, getPromptForBusinessType } from '@/lib/nanobanana'

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession()
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { prospectId, loomVideoUrl, generateHeroImg = true, calendlyUrl } = body

        if (!prospectId) {
            return NextResponse.json({ error: 'Prospect ID required' }, { status: 400 })
        }

        // Fetch prospect with business type for hero image generation
        const prospect = await prisma.prospect.findUnique({
            where: { id: prospectId },
            select: {
                id: true,
                companyName: true,
                businessType: true,
                city: true,
                auditToken: true,
                auditHeroImageUrl: true,
            },
        })

        if (!prospect) {
            return NextResponse.json({ error: 'Prospect not found' }, { status: 404 })
        }

        // Generate audit token if not exists
        const auditToken = prospect.auditToken || nanoid(12)

        // Generate password (company name lowercase, alphanumeric only)
        const auditPassword = prospect.companyName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')

        // Generate site slug for micro-site
        const siteSlug = prospect.companyName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')

        // Generate AI hero image if requested and not already exists
        let heroImageUrl = prospect.auditHeroImageUrl
        let heroImagePrompt: string | undefined

        if (generateHeroImg && !heroImageUrl) {
            const heroResult = await generateHeroImage(
                prospect.businessType,
                prospect.companyName,
                prospect.city
            )

            if (heroResult.success && heroResult.imageUrl) {
                heroImageUrl = heroResult.imageUrl
                heroImagePrompt = getPromptForBusinessType(prospect.businessType)
            }
        }

        // Update prospect with audit data
        await prisma.prospect.update({
            where: { id: prospectId },
            data: {
                auditToken,
                auditPassword,
                auditGeneratedAt: new Date(),
                loomVideoUrl: loomVideoUrl || undefined,
                auditHeroImageUrl: heroImageUrl || undefined,
                heroImagePrompt: heroImagePrompt || undefined,
                siteSlug,
                siteEnabled: true,
                calendlyUrl: calendlyUrl || undefined,
            },
        })

        // Build URLs
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
        const auditUrl = `${baseUrl}/audit/${auditToken}`
        const siteUrl = `${baseUrl}/sites/${siteSlug}`

        return NextResponse.json({
            success: true,
            auditUrl,
            siteUrl,
            auditToken,
            auditPassword,
            siteSlug,
            heroImageGenerated: !!heroImageUrl,
            message: `Audit page created for ${prospect.companyName}`,
        })
    } catch (error) {
        console.error('Error generating audit:', error)
        return NextResponse.json(
            { error: 'Failed to generate audit page' },
            { status: 500 }
        )
    }
}
