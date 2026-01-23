import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { MicroSiteClient } from './client'

export const dynamic = 'force-dynamic'

interface Props {
    params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const prospect = await prisma.prospect.findUnique({
        where: { siteSlug: params.slug },
        select: {
            companyName: true,
            city: true,
            auditHeroImageUrl: true,
        },
    })

    if (!prospect) {
        return { title: 'Page Not Found' }
    }

    return {
        title: `${prospect.companyName} - Digital Audit`,
        description: `Exclusive digital marketing audit for ${prospect.companyName}${prospect.city ? ` in ${prospect.city}` : ''}`,
        openGraph: {
            title: `${prospect.companyName} - Your Digital Presence Audit`,
            description: `See what's holding back your online growth`,
            images: prospect.auditHeroImageUrl ? [prospect.auditHeroImageUrl] : [],
        },
    }
}

export default async function MicroSitePage({ params }: Props) {
    const prospect = await prisma.prospect.findUnique({
        where: { siteSlug: params.slug },
        select: {
            id: true,
            companyName: true,
            city: true,
            businessType: true,
            googleRating: true,
            reviewCount: true,
            yelpRating: true,
            yelpReviewCount: true,
            angiRating: true,
            angiReviewCount: true,
            facebookRating: true,
            facebookReviewCount: true,
            website: true,
            loomVideoUrl: true,
            auditInfographicUrl: true,
            auditHeroImageUrl: true,
            auditGeneratedAt: true,
            auditPassword: true,
            siteEnabled: true,
            siteExpiresAt: true,
            calendlyUrl: true,
            demoLocationId: true,
            demoStatus: true,
        },
    })

    if (!prospect || !prospect.siteEnabled) {
        notFound()
    }

    // Check if site has expired
    if (prospect.siteExpiresAt && new Date(prospect.siteExpiresAt) < new Date()) {
        notFound()
    }

    // Update view tracking
    await prisma.prospect.update({
        where: { id: prospect.id },
        data: {
            auditViews: { increment: 1 },
            siteLastViewedAt: new Date(),
        },
    })

    return <MicroSiteClient prospect={prospect} />
}
