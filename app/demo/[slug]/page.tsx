import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { DemoClient } from './client'

export const dynamic = 'force-dynamic'

interface Props {
    params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    // slug could be prospect ID or site slug
    const prospect = await prisma.prospect.findFirst({
        where: {
            OR: [
                { id: params.slug },
                { siteSlug: params.slug },
            ],
        },
        select: { companyName: true },
    })

    if (!prospect) {
        return { title: 'Demo Not Found' }
    }

    return {
        title: `${prospect.companyName} - Live Demo`,
        description: `Experience the missed call text-back automation for ${prospect.companyName}`,
    }
}

export default async function DemoPage({ params }: Props) {
    const prospect = await prisma.prospect.findFirst({
        where: {
            OR: [
                { id: params.slug },
                { siteSlug: params.slug },
            ],
        },
        select: {
            id: true,
            companyName: true,
            businessType: true,
            city: true,
            auditHeroImageUrl: true,
            demoLocationId: true,
            demoStatus: true,
            demoTriggeredAt: true,
        },
    })

    if (!prospect) {
        notFound()
    }

    return <DemoClient prospect={prospect} />
}
