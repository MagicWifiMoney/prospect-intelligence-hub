import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { AuditPageClient } from './client'

export const dynamic = 'force-dynamic'

interface Props {
    params: { token: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const prospect = await prisma.prospect.findUnique({
        where: { auditToken: params.token },
        select: { companyName: true, city: true },
    })

    if (!prospect) {
        return { title: 'Audit Not Found' }
    }

    return {
        title: `Digital Audit: ${prospect.companyName}`,
        description: `Exclusive digital marketing audit for ${prospect.companyName} in ${prospect.city}`,
    }
}

export default async function AuditPage({ params }: Props) {
    const prospect = await prisma.prospect.findUnique({
        where: { auditToken: params.token },
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
            auditGeneratedAt: true,
            auditPassword: true,
        },
    })

    if (!prospect) {
        notFound()
    }

    // Increment view count
    await prisma.prospect.update({
        where: { id: prospect.id },
        data: { auditViews: { increment: 1 } },
    })

    return <AuditPageClient prospect={prospect} />
}
