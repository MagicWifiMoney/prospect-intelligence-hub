'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    Star, Globe, Play, Phone, DollarSign, AlertTriangle,
    ArrowRight, Clock, Download, Share2, CheckCircle, XCircle,
    Zap
} from 'lucide-react'

interface MicroSiteClientProps {
    prospect: {
        id: string
        companyName: string
        city: string | null
        businessType: string | null
        googleRating: number | null
        reviewCount: number | null
        yelpRating: number | null
        yelpReviewCount: number | null
        angiRating: number | null
        angiReviewCount: number | null
        facebookRating: number | null
        facebookReviewCount: number | null
        website: string | null
        loomVideoUrl: string | null
        auditInfographicUrl: string | null
        auditHeroImageUrl: string | null
        auditGeneratedAt: Date | null
        auditPassword: string | null
        siteExpiresAt: Date | null
        calendlyUrl: string | null
        demoLocationId: string | null
        demoStatus: string | null
    }
}

// Calculate directory health score
function calculateHealthScore(prospect: MicroSiteClientProps['prospect']): number {
    let score = 0
    if (prospect.googleRating) {
        score += (prospect.googleRating / 5) * 25
        score += Math.min(15, (prospect.reviewCount || 0) / 5)
    }
    if (prospect.yelpRating) score += (prospect.yelpRating / 5) * 20
    if (prospect.angiRating) score += (prospect.angiRating / 5) * 15
    if (prospect.facebookRating) score += (prospect.facebookRating / 5) * 15
    if (prospect.yelpRating) score += 5
    if (prospect.angiRating) score += 3
    if (prospect.facebookRating) score += 2
    return Math.min(100, Math.round(score))
}

// Estimate missed revenue
function estimateMissedRevenue(prospect: MicroSiteClientProps['prospect']): string {
    let missedMonthly = 0
    if (!prospect.yelpRating) missedMonthly += 750
    if ((prospect.reviewCount || 0) < 30) missedMonthly += 400
    missedMonthly += 800
    if (!prospect.website) missedMonthly += 500
    return `$${(missedMonthly * 12).toLocaleString()}`
}

// Countdown timer component
function ExpirationCountdown({ expiresAt }: { expiresAt: Date }) {
    const [timeLeft, setTimeLeft] = useState('')

    useEffect(() => {
        const updateTimer = () => {
            const now = new Date().getTime()
            const expiry = new Date(expiresAt).getTime()
            const diff = expiry - now

            if (diff <= 0) {
                setTimeLeft('Expired')
                return
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24))
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

            if (days > 0) {
                setTimeLeft(`${days}d ${hours}h remaining`)
            } else if (hours > 0) {
                setTimeLeft(`${hours}h ${minutes}m remaining`)
            } else {
                setTimeLeft(`${minutes}m remaining`)
            }
        }

        updateTimer()
        const interval = setInterval(updateTimer, 60000)
        return () => clearInterval(interval)
    }, [expiresAt])

    return (
        <div className="flex items-center gap-2 text-amber-400 text-sm">
            <Clock className="h-4 w-4" />
            <span>{timeLeft}</span>
        </div>
    )
}

export function MicroSiteClient({ prospect }: MicroSiteClientProps) {
    const healthScore = calculateHealthScore(prospect)
    const missedRevenue = estimateMissedRevenue(prospect)

    const directories = [
        { name: 'Google', rating: prospect.googleRating, reviews: prospect.reviewCount, color: 'text-yellow-400' },
        { name: 'Yelp', rating: prospect.yelpRating, reviews: prospect.yelpReviewCount, color: 'text-red-400' },
        { name: 'Angi', rating: prospect.angiRating, reviews: prospect.angiReviewCount, color: 'text-green-400' },
        { name: 'Facebook', rating: prospect.facebookRating, reviews: prospect.facebookReviewCount, color: 'text-blue-400' },
    ]

    return (
        <div className="min-h-screen bg-[#0a0f1a] text-white font-body selection:bg-cyan-500/30 overflow-x-hidden">
            {/* Hero Section with AI Image */}
            <div className="relative h-[60vh] min-h-[400px] overflow-hidden">
                {prospect.auditHeroImageUrl ? (
                    <img
                        src={prospect.auditHeroImageUrl}
                        alt={prospect.companyName}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/50 to-purple-900/50" />
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1a] via-[#0a0f1a]/60 to-transparent" />

                {/* Content */}
                <div className="absolute inset-0 flex items-end">
                    <div className="w-full max-w-5xl mx-auto px-6 pb-12">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full mb-4 border-cyan-500/30">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
                                </span>
                                <span className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
                                    Your Free Audit is Ready
                                </span>
                            </div>

                            <h1 className="text-4xl md:text-6xl font-bold font-display mb-3 tracking-tight">
                                {prospect.companyName}
                            </h1>

                            <p className="text-xl text-gray-300">
                                {prospect.city && `${prospect.city}, MN`} • {prospect.businessType}
                            </p>
                        </motion.div>
                    </div>
                </div>

                {/* Expiration timer */}
                {prospect.siteExpiresAt && (
                    <div className="absolute top-6 right-6">
                        <div className="glass px-4 py-2 rounded-full">
                            <ExpirationCountdown expiresAt={prospect.siteExpiresAt} />
                        </div>
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-6 py-12">
                {/* Score Cards */}
                <div className="grid md:grid-cols-2 gap-6 mb-12 -mt-20 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="glass rounded-3xl p-8 text-center"
                    >
                        <div className="text-sm uppercase tracking-widest text-gray-400 mb-4">Directory Health Score</div>
                        <div className="relative inline-flex items-center justify-center mb-4">
                            <svg className="w-32 h-32 transform -rotate-90">
                                <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="none" className="text-gray-800" />
                                <circle
                                    cx="64" cy="64" r="56"
                                    stroke="currentColor" strokeWidth="8" fill="none"
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
                        transition={{ delay: 0.4 }}
                        className="glass rounded-3xl p-8 text-center border-rose-500/20 bg-rose-500/5"
                    >
                        <div className="text-sm uppercase tracking-widest text-gray-400 mb-4">Estimated Missed Revenue</div>
                        <DollarSign className="h-12 w-12 text-rose-400 mx-auto mb-2" />
                        <div className="text-4xl font-bold text-rose-400 mb-2">{missedRevenue}</div>
                        <div className="text-sm text-gray-400">per year</div>
                    </motion.div>
                </div>

                {/* Directory Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="glass rounded-3xl p-8 mb-12"
                >
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                        <Globe className="h-6 w-6 text-cyan-400" />
                        Directory Presence Analysis
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {directories.map((dir) => (
                            <div
                                key={dir.name}
                                className={`relative p-5 rounded-2xl text-center ${dir.rating ? 'bg-white/5' : 'bg-rose-500/5 border border-rose-500/20'
                                    }`}
                            >
                                {!dir.rating && (
                                    <div className="absolute top-2 right-2">
                                        <AlertTriangle className="h-4 w-4 text-rose-400" />
                                    </div>
                                )}
                                <div className="text-xs uppercase tracking-wider text-gray-400 mb-2">{dir.name}</div>
                                <div className={`text-2xl font-bold mb-1 ${dir.rating ? 'text-white' : 'text-rose-400'}`}>
                                    {dir.rating ? dir.rating.toFixed(1) : 'Missing'}
                                </div>
                                {dir.rating && (
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
                                    {dir.rating ? `${dir.reviews || 0} reviews` : 'Not Found'}
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
                        transition={{ delay: 0.6 }}
                        className="glass rounded-3xl p-8 mb-12"
                    >
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                            <Play className="h-6 w-6 text-cyan-400" />
                            Your Personalized Walkthrough
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

                {/* Demo CTA (if demo available) */}
                {prospect.demoLocationId && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.65 }}
                        className="relative mb-12 rounded-3xl overflow-hidden p-1 bg-gradient-to-br from-purple-500 to-pink-500"
                    >
                        <div className="bg-[#0a0f1a] rounded-[1.4rem] p-8 text-center">
                            <Zap className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold mb-3">Experience It Live</h2>
                            <p className="text-gray-400 mb-6">
                                I've already set up a working demo for your business.<br />
                                Enter your phone to see the missed call text-back in action.
                            </p>
                            <a
                                href={`/demo/${prospect.id}`}
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                            >
                                Try the Live Demo
                                <ArrowRight className="h-5 w-5" />
                            </a>
                        </div>
                    </motion.div>
                )}

                {/* Calendly CTA */}
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

                        {prospect.calendlyUrl ? (
                            <div className="max-w-lg mx-auto">
                                <iframe
                                    src={`${prospect.calendlyUrl}?embed_domain=${typeof window !== 'undefined' ? window.location.hostname : ''}&embed_type=Inline&hide_gdpr_banner=1`}
                                    width="100%"
                                    height="700"
                                    frameBorder="0"
                                    className="rounded-xl"
                                />
                            </div>
                        ) : (
                            <a
                                href="#"
                                className="inline-flex items-center gap-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-10 py-5 rounded-2xl font-bold text-xl hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/30 transition-all active:scale-95"
                            >
                                Book a 15-Min Call
                                <ArrowRight className="h-6 w-6" />
                            </a>
                        )}
                    </div>
                </motion.div>

                {/* Footer */}
                <div className="mt-16 text-center space-y-4">
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={() => {
                                if (navigator.share) {
                                    navigator.share({
                                        title: `${prospect.companyName} Audit`,
                                        url: window.location.href
                                    })
                                }
                            }}
                            className="flex items-center gap-2 px-4 py-2 glass rounded-full text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            <Share2 className="h-4 w-4" />
                            Share
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-4 py-2 glass rounded-full text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            <Download className="h-4 w-4" />
                            Download PDF
                        </button>
                    </div>

                    <p className="text-gray-600 text-xs tracking-widest uppercase">
                        Powered by Alpha Prospect Intelligence
                    </p>
                    {prospect.auditGeneratedAt && (
                        <p className="text-gray-700 text-xs">
                            Generated {new Date(prospect.auditGeneratedAt).toLocaleDateString()}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
