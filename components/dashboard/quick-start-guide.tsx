
import {
    Search,
    Sparkles,
    Mail,
    ArrowRight,
    Target,
    Globe
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function QuickStartGuide() {
    const steps = [
        {
            title: 'Find Your First Prospect',
            description: 'Use the Multi-Source Scraper to find leads on Yelp or Google Maps.',
            icon: Search,
            href: '/prospects',
            cta: 'Go to Scraper',
            color: 'text-blue-400',
            bg: 'bg-blue-400/10'
        },
        {
            title: 'Generate an AI Audit',
            description: 'Pick a prospect and create an AI marketing report to wow them.',
            icon: Sparkles,
            href: '/prospects',
            cta: 'Create Audit',
            color: 'text-cyan-400',
            bg: 'bg-cyan-400/10'
        },
        {
            title: 'Set Up Email Outreach',
            description: 'Connect your Gmail to send personalized audit reports directly.',
            icon: Mail,
            href: '/email',
            cta: 'Connect Gmail',
            color: 'text-amber-400',
            bg: 'bg-amber-400/10'
        },
        {
            title: 'Score Your Leads',
            description: 'Review AI insights to focus on the highest potential businesses.',
            icon: Target,
            href: '/prospects',
            cta: 'View Leads',
            color: 'text-purple-400',
            bg: 'bg-purple-400/10'
        }
    ]

    return (
        <div className="bg-gray-900/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/5 bg-white/5">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Globe className="w-5 h-5 text-cyan-400" />
                    Quick Start Guide
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                    Follow these steps to get the most out of Prospect Intelligence.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/5">
                {steps.map((step, i) => (
                    <div key={i} className="bg-[#0a0f1a] p-6 hover:bg-white/5 transition-colors group">
                        <div className={`w-10 h-10 rounded-xl ${step.bg} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                            <step.icon className={`w-5 h-5 ${step.color}`} />
                        </div>
                        <h3 className="font-semibold text-white mb-2">{step.title}</h3>
                        <p className="text-sm text-gray-500 mb-6 line-clamp-2">
                            {step.description}
                        </p>
                        <Button asChild variant="ghost" className="w-full justify-between text-gray-400 hover:text-white hover:bg-white/10 group-hover:bg-white/10">
                            <Link href={step.href}>
                                {step.cta}
                                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    )
}
