'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Radar,
  Target,
  Zap,
  TrendingUp,
  Mail,
  BarChart3,
  Users,
  Star,
  ArrowRight,
  Check,
  Sparkles,
  Globe,
  Search,
  ChevronRight,
} from 'lucide-react'

// Animated prospect blip for radar
const ProspectBlip = ({ delay, angle, distance }: { delay: number; angle: number; distance: number }) => {
  const x = Math.cos(angle) * distance
  const y = Math.sin(angle) * distance

  return (
    <motion.div
      className="absolute w-2 h-2 rounded-full bg-cyan-400"
      style={{
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
        boxShadow: '0 0 12px rgba(6, 182, 212, 0.8), 0 0 24px rgba(6, 182, 212, 0.4)',
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        scale: [0, 1.2, 1, 0],
      }}
      transition={{
        duration: 3,
        delay: delay,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  )
}

// Animated radar sweep
const RadarSweep = () => (
  <motion.div
    className="absolute inset-0 rounded-full"
    style={{
      background: 'conic-gradient(from 0deg, transparent 0deg, rgba(6, 182, 212, 0.3) 30deg, transparent 60deg)',
    }}
    animate={{ rotate: 360 }}
    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
  />
)

// Feature card component
const FeatureCard = ({ icon: Icon, title, description, delay }: {
  icon: any;
  title: string;
  description: string;
  delay: number;
}) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6, delay }}
      className="group relative"
    >
      <div className="glass-strong rounded-2xl p-6 h-full transition-all duration-500 hover:bg-white/15 hover:scale-[1.02] hover:shadow-2xl">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <Icon className="w-6 h-6 text-cyan-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2 font-display">{title}</h3>
          <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
        </div>
      </div>
    </motion.div>
  )
}

// Step card for "How it works"
const StepCard = ({ number, title, description, delay }: {
  number: string;
  title: string;
  description: string;
  delay: number;
}) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -30 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
      transition={{ duration: 0.5, delay }}
      className="flex gap-6 items-start"
    >
      <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
        <span className="text-xl font-bold text-white font-display">{number}</span>
      </div>
      <div>
        <h3 className="text-xl font-semibold text-white mb-2 font-display">{title}</h3>
        <p className="text-gray-400 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  )
}

// Stats counter animation
const AnimatedStat = ({ value, label, suffix = '' }: { value: number; label: string; suffix?: string }) => {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (isInView) {
      const duration = 2000
      const steps = 60
      const increment = value / steps
      let current = 0

      const timer = setInterval(() => {
        current += increment
        if (current >= value) {
          setCount(value)
          clearInterval(timer)
        } else {
          setCount(Math.floor(current))
        }
      }, duration / steps)

      return () => clearInterval(timer)
    }
  }, [isInView, value])

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl md:text-5xl font-bold text-white font-display mb-2">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-gray-400 text-sm">{label}</div>
    </div>
  )
}

export function LandingPage() {
  const { scrollYProgress } = useScroll()
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95])

  // Generate random prospect blips
  const blips = Array.from({ length: 12 }, (_, i) => ({
    delay: i * 0.3,
    angle: (Math.PI * 2 * i) / 12 + Math.random() * 0.5,
    distance: 80 + Math.random() * 60,
  }))

  const features = [
    {
      icon: Radar,
      title: "Smart Lead Scoring",
      description: "AI-powered scoring identifies high-ticket prospects and hidden goldmines in your market automatically."
    },
    {
      icon: Search,
      title: "Automated Scraping",
      description: "Pull fresh leads from Google Maps with one click. Smart deduplication keeps your database clean."
    },
    {
      icon: TrendingUp,
      title: "Opportunity Detection",
      description: "Spot 'boring businesses' with massive potential - established companies with zero online presence."
    },
    {
      icon: Mail,
      title: "Email Outreach",
      description: "Send personalized mail-merge campaigns directly from the platform with built-in tracking."
    },
    {
      icon: Globe,
      title: "Lead Gen Insights",
      description: "Discover untapped niches where you could build SEO lead gen sites with high-value traffic."
    },
    {
      icon: BarChart3,
      title: "Market Analytics",
      description: "Track trends, anomalies, and new business openings across your entire target geography."
    },
  ]

  return (
    <div className="landing-page min-h-screen bg-[#0a0f1a] text-white overflow-x-hidden">
      {/* Noise overlay */}
      <div className="noise-overlay" />

      {/* Gradient mesh background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-cyan-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-amber-500/10 rounded-full blur-[150px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-radial from-cyan-500/5 to-transparent" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
                <Radar className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold font-display">Prospect Hub</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-400 hover:text-white transition-colors text-sm">Features</a>
              <a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors text-sm">How it Works</a>
              <a href="#pricing" className="text-gray-400 hover:text-white transition-colors text-sm">Pricing</a>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/signin">
                <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signin">
                <Button className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white border-0 shadow-lg shadow-cyan-500/25">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-screen flex items-center justify-center pt-20"
      >
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Copy */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <Badge className="mb-6 bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20">
                <Sparkles className="w-3 h-3 mr-1" />
                AI-Powered Lead Intelligence
              </Badge>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold font-display leading-[1.1] mb-6">
                Find Your Next
                <span className="text-gradient block">Million Dollar</span>
                Client
              </h1>
              <p className="text-xl text-gray-400 mb-8 leading-relaxed max-w-lg">
                Stop guessing which contractors need your services. Our AI scans thousands of Minnesota businesses to surface the <span className="text-cyan-400">highest-value prospects</span> with outdated digital presence.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link href="/auth/signin">
                  <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white border-0 shadow-xl shadow-cyan-500/30 px-8 h-14 text-lg">
                    Start Finding Leads
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-8">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-[#0a0f1a] flex items-center justify-center">
                      <Users className="w-4 h-4 text-gray-400" />
                    </div>
                  ))}
                </div>
                <div className="text-sm">
                  <div className="flex items-center text-amber-400 mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <span className="text-gray-400">Trusted by 50+ agencies</span>
                </div>
              </div>
            </motion.div>

            {/* Right side - Animated Radar */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
              className="relative flex items-center justify-center"
            >
              <div className="relative w-80 h-80 md:w-96 md:h-96">
                {/* Radar rings */}
                {[1, 2, 3, 4].map((ring) => (
                  <div
                    key={ring}
                    className="absolute inset-0 rounded-full border border-cyan-500/20"
                    style={{
                      transform: `scale(${ring * 0.25})`,
                    }}
                  />
                ))}

                {/* Cross lines */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-full w-px bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent" />
                </div>

                {/* Animated sweep */}
                <RadarSweep />

                {/* Prospect blips */}
                {blips.map((blip, i) => (
                  <ProspectBlip key={i} {...blip} />
                ))}

                {/* Center dot */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50" />
                </div>

                {/* Glow effect */}
                <div className="absolute inset-0 rounded-full bg-cyan-500/5 blur-xl" />
              </div>

              {/* Floating cards */}
              <motion.div
                className="absolute -top-4 right-0 glass-strong rounded-xl p-4 shadow-xl"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Hot Lead Found</div>
                    <div className="text-xs text-gray-400">Score: 94/100</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="absolute -bottom-4 left-0 glass-strong rounded-xl p-4 shadow-xl"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <Target className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Goldmine Alert</div>
                    <div className="text-xs text-gray-400">No website, 120+ reviews</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
            <motion.div
              className="w-1 h-2 bg-white/50 rounded-full"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </motion.section>

      {/* Stats Section */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="glass-strong rounded-3xl p-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <AnimatedStat value={3740} label="Prospects Tracked" suffix="+" />
              <AnimatedStat value={642} label="Goldmines Found" />
              <AnimatedStat value={94} label="Avg. Lead Score" />
              <AnimatedStat value={12} label="Cities Covered" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-amber-500/10 text-amber-400 border-amber-500/20">
              Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold font-display mb-6">
              Everything You Need to
              <span className="text-gradient"> Dominate</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              From lead discovery to closed deals, we&apos;ve built the ultimate prospecting toolkit for digital marketing agencies.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <FeatureCard key={feature.title} {...feature} delay={i * 0.1} />
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <Badge className="mb-4 bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                  How It Works
                </Badge>
                <h2 className="text-4xl md:text-5xl font-bold font-display mb-6">
                  From Zero to
                  <span className="text-gradient"> Pipeline Full</span>
                </h2>
                <p className="text-xl text-gray-400 mb-12">
                  Stop cold calling random businesses. Our system does the heavy lifting so you can focus on closing.
                </p>
              </motion.div>

              <div className="space-y-8">
                <StepCard
                  number="1"
                  title="Scrape Fresh Leads"
                  description="One-click Google Maps scraping pulls thousands of local businesses into your database with full contact info."
                  delay={0.1}
                />
                <StepCard
                  number="2"
                  title="AI Scores & Tags"
                  description="Our algorithm analyzes reviews, websites, and business signals to score each prospect's potential value."
                  delay={0.2}
                />
                <StepCard
                  number="3"
                  title="Prioritize & Reach Out"
                  description="Focus on goldmines first - businesses with high revenue potential and zero digital presence. Send personalized emails directly from the platform."
                  delay={0.3}
                />
              </div>
            </div>

            {/* Visual */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="glass-strong rounded-3xl p-8">
                {/* Mock dashboard preview */}
                <div className="bg-[#0d1424] rounded-2xl overflow-hidden">
                  {/* Header bar */}
                  <div className="bg-[#141c2e] px-4 py-3 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <div className="ml-4 flex-1 h-6 rounded bg-white/5" />
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-4">
                    {/* Prospect cards */}
                    {[
                      { name: "Twin Cities HVAC", score: 94, tag: "Goldmine", tagColor: "amber" },
                      { name: "Metro Plumbing Pros", score: 87, tag: "Hot Lead", tagColor: "cyan" },
                      { name: "Reliable Roofing MN", score: 82, tag: "High Ticket", tagColor: "green" },
                    ].map((prospect, i) => (
                      <motion.div
                        key={prospect.name}
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 + i * 0.15 }}
                        className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                            <Users className="w-5 h-5 text-gray-400" />
                          </div>
                          <div>
                            <div className="font-medium text-white">{prospect.name}</div>
                            <div className="text-sm text-gray-500">Minneapolis, MN</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={`bg-${prospect.tagColor}-500/20 text-${prospect.tagColor}-400 border-${prospect.tagColor}-500/30`}>
                            {prospect.tag}
                          </Badge>
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center font-bold text-white">
                            {prospect.score}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-br from-cyan-500/20 to-amber-500/20 rounded-3xl blur-3xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Placeholder */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-green-500/10 text-green-400 border-green-500/20">
              Testimonials
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold font-display mb-6">
              Agencies Love
              <span className="text-gradient"> Prospect Hub</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "Found 3 clients in our first week. The goldmine feature is insane - these businesses literally have no online presence but stellar reviews.",
                author: "Marketing Agency Owner",
                company: "Minneapolis"
              },
              {
                quote: "We used to spend hours on Google Maps manually. Now we scrape 500 leads and have them scored in minutes. Game changer.",
                author: "Lead Gen Specialist",
                company: "St. Paul"
              },
              {
                quote: "The scoring algorithm is scary accurate. Almost every prospect with 85+ score has converted into a paying client for us.",
                author: "SEO Consultant",
                company: "Twin Cities"
              }
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-strong rounded-2xl p-8"
              >
                <div className="flex mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-5 h-5 text-amber-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-amber-500" />
                  <div>
                    <div className="font-medium text-white">{testimonial.author}</div>
                    <div className="text-sm text-gray-500">{testimonial.company}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="pricing" className="py-32 relative">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-strong rounded-3xl p-12 md:p-16 relative overflow-hidden"
          >
            {/* Background effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-amber-500/10" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />

            <div className="relative">
              <h2 className="text-4xl md:text-5xl font-bold font-display mb-6">
                Ready to Find Your
                <span className="text-gradient"> Next Big Client?</span>
              </h2>
              <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
                Join 50+ digital marketing agencies using Prospect Hub to find and close high-value Minnesota contractors.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Link href="/auth/signin">
                  <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white border-0 shadow-xl shadow-cyan-500/30 px-8 h-14 text-lg">
                    Get Started Free
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  No credit card required
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  3,700+ prospects ready
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  Cancel anytime
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
                <Radar className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold font-display">Prospect Hub</span>
            </div>
            <div className="text-sm text-gray-500">
              © 2024 Prospect Hub. Built for Minnesota digital marketing agencies.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
