'use client'

import { CheckCircle, XCircle, TrendingUp, Star, Globe, Play, Phone, DollarSign, AlertTriangle, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

interface AuditContentProps {
    prospect: {
        companyName: string
        city?: string | null
        businessType?: string | null
        googleRating?: number | null
        reviewCount?: number | null
        yelpRating?: number | null
        yelpReviewCount?: number | null
        angiRating?: number | null
        angiReviewCount?: number | null
        facebookRating?: number | null
        facebookReviewCount?: number | null
        website?: string | null
        loomVideoUrl?: string | null
        auditInfographicUrl?: string | null
        auditGeneratedAt?: Date | null
    }
    competitors?: Array<{
        name: string
        rating: number
        reviewCount: number
    }>
}

// Calculate directory health score (0-100)
function calculateHealthScore(prospect: AuditContentProps['prospect']): number {
    let score = 0
    let factors = 0

    // Google (worth 40 points)
    if (prospect.googleRating) {
        score += (prospect.googleRating / 5) * 20
        factors++
        if ((prospect.reviewCount || 0) > 50) score += 10
        else if ((prospect.reviewCount || 0) > 20) score += 5
        score += Math.min(10, (prospect.reviewCount || 0) / 10)
    }

    // Yelp (worth 20 points)
    if (prospect.yelpRating) {
        score += (prospect.yelpRating / 5) * 15
        factors++
        score += Math.min(5, (prospect.yelpReviewCount || 0) / 5)
    }

    // Angi (worth 15 points)
    if (prospect.angiRating) {
        score += (prospect.angiRating / 5) * 10
        factors++
        score += Math.min(5, (prospect.angiReviewCount || 0) / 5)
    }

    // Facebook (worth 15 points)
    if (prospect.facebookRating) {
        score += (prospect.facebookRating / 5) * 10
        factors++
        score += Math.min(5, (prospect.facebookReviewCount || 0) / 5)
    }

    // Website (worth 10 points)
    if (prospect.website) {
        score += 10
    }

    return Math.min(100, Math.round(score))
}

// Estimate missed revenue based on gaps
function estimateMissedRevenue(prospect: AuditContentProps['prospect']): string {
    let missedMonthly = 0

    // Missing Yelp = ~$500-1000/mo
    if (!prospect.yelpRating) missedMonthly += 750

    // Low review count = ~$300-500/mo
    if ((prospect.reviewCount || 0) < 30) missedMonthly += 400

    // Missed calls estimate (industry average)
    missedMonthly += 800 // ~62% missed calls = 2-3 jobs/mo

    // No website = big miss
    if (!prospect.website) missedMonthly += 500

    const annual = missedMonthly * 12
    return `$${annual.toLocaleString()}/year`
}

export function AuditContent({ prospect, competitors = [] }: AuditContentProps) {
    const healthScore = calculateHealthScore(prospect)
    const missedRevenue = estimateMissedRevenue(prospect)

    const directories = [
        {
            name: 'Google Maps',
            rating: prospect.googleRating,
            reviews: prospect.reviewCount,
            color: 'text-yellow-400',
            present: !!prospect.googleRating,
        },
        {
            name: 'Yelp',
            rating: prospect.yelpRating,
            reviews: prospect.yelpReviewCount,
            color: 'text-red-400',
            present: !!prospect.yelpRating,
        },
        {
            name: 'Angi',
            rating: prospect.angiRating,
            reviews: prospect.angiReviewCount,
            color: 'text-green-400',
            present: !!prospect.angiRating,
        },
        {
            name: 'Facebook',
            rating: prospect.facebookRating,
            reviews: prospect.facebookReviewCount,
            color: 'text-blue-400',
            present: !!prospect.facebookRating,
        },
    ]

    return (
        <div className="min-h-screen bg-[#0a0f1a] text-white font-body selection:bg-cyan-500/30 overflow-x-hidden">
            {/* Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
            </div>

            <div className="relative max-w-4xl mx-auto px-6 py-16 md:py-24">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full mb-6 border-cyan-500/30">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
                            Exclusive Digital Audit
                        </span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-bold font-display mb-4 tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
                        {prospect.companyName}
                    </h1>

                    <p className="text-gray-400 text-lg">
                        {prospect.city}, MN • {prospect.businessType}
                    </p>
                </motion.div>

                {/* Health Score & Missed Revenue */}
                <div className="grid md:grid-cols-2 gap-6 mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass rounded-3xl p-8 text-center"
                    >
                        <div className="text-sm uppercase tracking-widest text-gray-400 mb-4">Directory Health Score</div>
                        <div className="relative inline-flex items-center justify-center mb-4">
                            <svg className="w-32 h-32 transform -rotate-90">
                                <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="none" className="text-gray-800" />
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="56"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    fill="none"
                                    strokeDasharray={`${(healthScore / 100) * 352} 352`}
                                    className={healthScore >= 70 ? 'text-emerald-500' : healthScore >= 40 ? 'text-amber-500' : 'text-rose-500'}
                                />
                            </svg>
                            <div className="absolute text-4xl font-bold">{healthScore}</div>
                        </div>
                        <div className={`text-sm font-semibold ${healthScore >= 70 ? 'text-emerald-400' : healthScore >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>
                            {healthScore >= 70 ? 'Healthy' : healthScore >= 40 ? 'Needs Work' : 'Critical Gaps'}
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass rounded-3xl p-8 text-center border-rose-500/20 bg-rose-500/5"
                    >
                        <div className="text-sm uppercase tracking-widest text-gray-400 mb-4">Estimated Missed Revenue</div>
                        <div className="flex items-center justify-center mb-4">
                            <DollarSign className="h-12 w-12 text-rose-400" />
                        </div>
                        <div className="text-4xl font-bold text-rose-400 mb-2">{missedRevenue}</div>
                        <div className="text-sm text-gray-400">Based on industry benchmarks</div>
                    </motion.div>
                </div>

                {/* Directory Health Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass rounded-3xl p-8 mb-12"
                >
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                        <Globe className="h-6 w-6 text-cyan-400" />
                        Directory Presence
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {directories.map((dir) => (
                            <div
                                key={dir.name}
                                className={`relative p-5 rounded-2xl text-center ${dir.present ? 'bg-white/5' : 'bg-rose-500/5 border border-rose-500/20'
                                    }`}
                            >
                                {!dir.present && (
                                    <div className="absolute top-2 right-2">
                                        <AlertTriangle className="h-4 w-4 text-rose-400" />
                                    </div>
                                )}
                                <div className="text-xs uppercase tracking-wider text-gray-400 mb-2">{dir.name}</div>
                                <div className={`text-2xl font-bold mb-1 ${dir.present ? 'text-white' : 'text-rose-400'}`}>
                                    {dir.present ? dir.rating?.toFixed(1) : 'Missing'}
                                </div>
                                {dir.present && (
                                    <div className="flex justify-center mb-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`h-3 w-3 ${i < Math.floor(dir.rating || 0) ? `${dir.color} fill-current` : 'text-gray-600'}`}
                                            />
                                        ))}
                                    </div>
                                )}
                                <div className="text-xs text-gray-500">
                                    {dir.present ? `${dir.reviews || 0} reviews` : 'Not Found'}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Loom Video */}
                {prospect.loomVideoUrl && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="glass rounded-3xl p-8 mb-12"
                    >
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                            <Play className="h-6 w-6 text-cyan-400" />
                            Personalized Video Walkthrough
                        </h2>
                        <div className="aspect-video rounded-2xl overflow-hidden bg-black/50">
                            <iframe
                                src={prospect.loomVideoUrl.replace('share', 'embed')}
                                allowFullScreen
                                className="w-full h-full"
                            />
                        </div>
                    </motion.div>
                )}

                {/* Infographic */}
                {prospect.auditInfographicUrl && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="glass rounded-3xl p-8 mb-12"
                    >
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                            <TrendingUp className="h-6 w-6 text-cyan-400" />
                            Your Audit Snapshot
                        </h2>
                        <img
                            src={prospect.auditInfographicUrl}
                            alt="Audit Infographic"
                            className="w-full max-w-2xl mx-auto rounded-xl"
                        />
                        <p className="text-center text-gray-500 text-sm mt-4">
                            Right-click to save this infographic
                        </p>
                    </motion.div>
                )}

                {/* Competitor Comparison */}
                {competitors.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="glass rounded-3xl p-8 mb-12"
                    >
                        <h2 className="text-xl font-bold mb-6">Competitor Comparison</h2>
                        <div className="space-y-4">
                            {/* You */}
                            <div className="flex items-center justify-between p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-cyan-400" />
                                    <span className="font-semibold">{prospect.companyName} (You)</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-gray-400">{prospect.reviewCount || 0} reviews</span>
                                    <span className="font-bold text-cyan-400">{prospect.googleRating?.toFixed(1) || 'N/A'}</span>
                                </div>
                            </div>

                            {/* Competitors */}
                            {competitors.map((comp, i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                                    <div className="flex items-center gap-3">
                                        <XCircle className="h-5 w-5 text-gray-500" />
                                        <span className="text-gray-300">{comp.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm text-gray-400">{comp.reviewCount} reviews</span>
                                        <span className="font-bold text-gray-300">{comp.rating.toFixed(1)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="relative rounded-[3rem] overflow-hidden p-1 bg-gradient-to-br from-cyan-500 to-blue-600 shadow-2xl shadow-cyan-500/20"
                >
                    <div className="bg-[#0a0f1a] rounded-[2.9rem] p-10 md:p-16 text-center">
                        <Phone className="h-12 w-12 text-cyan-400 mx-auto mb-6" />
                        <h2 className="text-3xl md:text-4xl font-bold font-display text-white mb-4">
                            Let&apos;s Fix This Together
                        </h2>
                        <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
                            I can help you recover that <span className="text-rose-400 font-semibold">{missedRevenue}</span> and dominate your local market.
                            <br />15 minutes. No pressure. Just answers.
                        </p>
                        <a
                            href="#"
                            className="inline-flex items-center gap-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-10 py-5 rounded-2xl font-bold text-xl hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/30 transition-all active:scale-95"
                        >
                            Book a 15-Min Call
                            <ArrowRight className="h-6 w-6" />
                        </a>
                    </div>
                </motion.div>

                {/* Footer */}
                <div className="mt-16 text-center text-gray-600 text-xs">
                    <p className="tracking-widest uppercase mb-2">Powered by Alpha Prospect Intelligence</p>
                    {prospect.auditGeneratedAt && (
                        <p>Generated {new Date(prospect.auditGeneratedAt).toLocaleDateString()}</p>
                    )}
                </div>
            </div>
        </div>
    )
}
