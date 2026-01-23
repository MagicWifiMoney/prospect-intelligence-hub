import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { PublicReportContent } from '@/components/reports/public-report-content'

export const dynamic = 'force-dynamic'

interface Props {
    params: { token: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const report = await prisma.prospectReport.findUnique({
        where: { shareToken: params.token },
        include: { prospect: { select: { companyName: true, city: true } } },
    })

    if (!report) {
        return { title: 'Report Not Found' }
    }

    return {
        title: `Marketing Audit: ${report.prospect.companyName}`,
        description: report.headline,
    }
}

export default async function PublicReportPage({ params }: Props) {
    const report = await prisma.prospectReport.findUnique({
        where: { shareToken: params.token },
        include: {
            prospect: {
                select: {
                    companyName: true,
                    city: true,
                    businessType: true,
                    googleRating: true,
                    reviewCount: true,
                    yelpRating: true,
                    yelpReviewCount: true,
                    yelpUrl: true,
                    angiRating: true,
                    angiReviewCount: true,
                    facebookRating: true,
                    facebookReviewCount: true,
                    website: true,
                },
            },
        },
    })

    if (!report) {
        notFound()
    }

    // Increment view count
    await prisma.prospectReport.update({
        where: { id: report.id },
        data: {
            views: { increment: 1 },
            lastViewedAt: new Date(),
        },
    })

    return <PublicReportContent report={report} prospect={report.prospect} />
}
