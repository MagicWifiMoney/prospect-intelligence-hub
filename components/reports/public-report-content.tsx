'use client'

import { CheckCircle, XCircle, TrendingUp, Users, Star, Globe, Calendar, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

interface PublicReportContentProps {
    report: any
    prospect: any
}

export function PublicReportContent({ report, prospect }: PublicReportContentProps) {
    return (
        <div className="min-h-screen bg-[#0a0f1a] text-white font-body selection:bg-cyan-500/30 overflow-x-hidden">
            {/* Noise Overlay */}
            <div className="noise-overlay" />

            {/* Background Gradients */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
            </div>

            <div className="relative max-w-4xl mx-auto px-6 py-16 md:py-24">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full mb-8 border-cyan-500/30">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
                            Personalized Marketing Audit
                        </span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold font-display mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
                        {prospect.companyName}
                    </h1>

                    <p className="text-gray-400 text-xl font-light">
                        {prospect.city}, MN <span className="mx-2 text-gray-600">•</span>
                        {new Date(report.generatedAt).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                        })}
                    </p>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                    {[
                        { label: 'Google Rating', value: prospect.googleRating || 'N/A', icon: Star, color: 'text-yellow-400' },
                        { label: 'Total Reviews', value: prospect.reviewCount || 0, icon: Users, color: 'text-cyan-400' },
                        { label: 'Website', value: prospect.website ? 'Active' : 'Missing', icon: Globe, color: 'text-emerald-400' },
                        { label: 'Lost Revenue', value: report.estimatedValue, icon: TrendingUp, color: 'text-rose-400', highlight: true },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 * i, duration: 0.5 }}
                            className={`glass p-6 rounded-3xl text-center flex flex-col items-center justify-center group hover:border-white/20 transition-all ${stat.highlight ? 'bg-rose-500/5 border-rose-500/20' : ''}`}
                        >
                            <stat.icon className={`h-6 w-6 ${stat.color} mb-3 group-hover:scale-110 transition-transform`} />
                            <div className={`text-2xl font-bold mb-1 ${stat.highlight ? 'text-rose-400' : 'text-white'}`}>
                                {stat.value}
                            </div>
                            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">{stat.label}</div>
                        </motion.div>
                    ))}
                </div>

                {/* Headline / Hook */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="glass-strong p-8 rounded-[2rem] mb-12 border-cyan-500/20 text-center relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500" />
                    <h2 className="text-2xl md:text-3xl font-semibold font-display text-white leading-tight">
                        &ldquo;{report.headline}&rdquo;
                    </h2>
                </motion.div>

                {/* Content Cards */}
                <div className="space-y-8 mb-16">
                    {/* Strengths */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="glass rounded-3xl overflow-hidden"
                    >
                        <div className="p-8 md:p-10">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                    <CheckCircle className="h-6 w-6 text-emerald-400" />
                                </div>
                                <h3 className="text-2xl font-bold font-display text-white">Competitive Strengths</h3>
                            </div>
                            <div className="grid md:grid-cols-2 gap-6">
                                {(report.strengths || []).map((strength: string, i: number) => (
                                    <div key={i} className="flex items-start gap-4 p-5 rounded-2xl bg-white/5 border border-white/5">
                                        <div className="mt-1 h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                        </div>
                                        <p className="text-gray-300 leading-relaxed">{strength}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Opportunities */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="glass rounded-3xl overflow-hidden border-rose-500/20"
                    >
                        <div className="p-8 md:p-10">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="h-10 w-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
                                    <XCircle className="h-6 w-6 text-rose-400" />
                                </div>
                                <h3 className="text-2xl font-bold font-display text-white">Critical Gaps Detected</h3>
                            </div>
                            <div className="space-y-4">
                                {(report.opportunities || []).map((opportunity: string, i: number) => (
                                    <div key={i} className="flex items-center gap-4 p-5 rounded-2xl bg-rose-500/5 border border-rose-500/10 hover:border-rose-500/30 transition-colors">
                                        <div className="h-2 w-2 rounded-full bg-rose-400 flex-shrink-0" />
                                        <p className="text-gray-200 font-medium">{opportunity}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Competitor Insights */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="glass rounded-3xl overflow-hidden"
                    >
                        <div className="p-8 md:p-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-10 w-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                                    <TrendingUp className="h-6 w-6 text-cyan-400" />
                                </div>
                                <h3 className="text-2xl font-bold font-display text-white">Competitive Intelligence</h3>
                            </div>
                            <p className="text-gray-300 text-lg leading-relaxed italic">
                                &ldquo;{report.competitorInsights}&rdquo;
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* CTA Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="relative rounded-[3rem] overflow-hidden p-1 bg-gradient-to-br from-cyan-500 to-blue-600 shadow-2xl shadow-cyan-500/20"
                >
                    <div className="bg-[#0a0f1a] rounded-[2.9rem] p-10 md:p-16 text-center">
                        <h2 className="text-3xl md:text-4xl font-bold font-display text-white mb-6">
                            Ignite Your Online Growth
                        </h2>
                        <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto font-light">
                            Stop losing <span className="text-rose-400 font-semibold">{report.estimatedValue}</span> to competitors.
                            Let&apos;s build a roadmap to dominate your local market.
                        </p>
                        <a
                            href="#"
                            className="inline-flex items-center gap-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-10 py-5 rounded-2xl font-bold text-xl hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/30 transition-all active:scale-95"
                        >
                            {report.ctaText}
                            <ArrowRight className="h-6 w-6" />
                        </a>
                    </div>
                </motion.div>

                {/* Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="mt-20 text-center border-t border-white/5 pt-12"
                >
                    <div className="text-gray-500 text-sm flex flex-col items-center gap-4">
                        <p className="tracking-widest uppercase text-[10px] font-bold">Powered by Alpha Prospect Intelligence</p>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5 glass px-3 py-1 rounded-full">
                                <Users className="h-3 w-3 text-cyan-400" />
                                <span>{report.views + 1} Views</span>
                            </div>
                            <div className="flex items-center gap-1.5 glass px-3 py-1 rounded-full">
                                <Calendar className="h-3 w-3 text-cyan-400" />
                                <span>Expires in 30 days</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
