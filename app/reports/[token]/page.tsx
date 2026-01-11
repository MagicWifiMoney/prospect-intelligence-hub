import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { CheckCircle, XCircle, TrendingUp, Users, Star, Globe, Phone, Calendar } from 'lucide-react'

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

    const { prospect } = report

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="max-w-4xl mx-auto px-4 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-block px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-semibold uppercase tracking-wider rounded-full mb-6">
                        Free Marketing Audit
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
                        {prospect.companyName}
                    </h1>
                    <p className="text-gray-400 text-lg">
                        {prospect.city}, MN • Generated {new Date(report.generatedAt).toLocaleDateString()}
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5 text-center">
                        <Star className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
                        <div className="text-3xl font-bold text-white">{prospect.googleRating || 'N/A'}</div>
                        <div className="text-sm text-gray-500">Google Rating</div>
                    </div>
                    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5 text-center">
                        <Users className="h-6 w-6 text-cyan-400 mx-auto mb-2" />
                        <div className="text-3xl font-bold text-white">{prospect.reviewCount || 0}</div>
                        <div className="text-sm text-gray-500">Total Reviews</div>
                    </div>
                    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5 text-center">
                        <Globe className="h-6 w-6 text-green-400 mx-auto mb-2" />
                        <div className="text-3xl font-bold text-white">{prospect.website ? 'Yes' : 'No'}</div>
                        <div className="text-sm text-gray-500">Has Website</div>
                    </div>
                    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5 text-center">
                        <TrendingUp className="h-6 w-6 text-red-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-red-400">{report.estimatedValue}</div>
                        <div className="text-sm text-gray-500">Lost Revenue</div>
                    </div>
                </div>

                {/* Headline */}
                <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl p-6 mb-8 text-center">
                    <h2 className="text-2xl font-semibold text-white">{report.headline}</h2>
                </div>

                {/* Main Content Card */}
                <div className="bg-white/5 backdrop-blur border border-white/10 rounded-3xl overflow-hidden mb-8">
                    {/* Strengths */}
                    <div className="p-8 border-b border-white/10">
                        <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
                            <CheckCircle className="h-5 w-5" />
                            What You&apos;re Doing Right
                        </h3>
                        <ul className="space-y-3">
                            {report.strengths.map((strength, i) => (
                                <li key={i} className="flex items-start gap-3 text-gray-300">
                                    <span className="text-green-400 mt-0.5">✓</span>
                                    {strength}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Opportunities */}
                    <div className="p-8 border-b border-white/10">
                        <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                            <XCircle className="h-5 w-5" />
                            Growth Opportunities
                        </h3>
                        <ul className="space-y-3">
                            {report.opportunities.map((opportunity, i) => (
                                <li key={i} className="bg-red-500/10 border-l-4 border-red-500 px-4 py-3 rounded-r-lg text-gray-300">
                                    {opportunity}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Competitor Insights */}
                    <div className="p-8">
                        <h3 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Competitive Analysis
                        </h3>
                        <p className="text-gray-300 leading-relaxed">{report.competitorInsights}</p>
                    </div>
                </div>

                {/* CTA */}
                <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-3xl p-10 text-center">
                    <h2 className="text-2xl font-bold text-white mb-3">
                        Ready to Capture More Customers?
                    </h2>
                    <p className="text-gray-400 mb-6 max-w-md mx-auto">
                        Let&apos;s discuss how to fix these gaps and start getting more leads from Google.
                    </p>
                    <a
                        href="#"
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity"
                    >
                        <Calendar className="h-5 w-5" />
                        {report.ctaText}
                    </a>
                </div>

                {/* Footer */}
                <div className="text-center mt-10 text-gray-500 text-sm">
                    <p>This report was generated by Prospect Intelligence Hub</p>
                    <p className="mt-1">Views: {report.views + 1}</p>
                </div>
            </div>
        </div>
    )
}
