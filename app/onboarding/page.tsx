'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Loader2,
  Globe,
  Target,
  MapPin,
  Sparkles,
  Building2,
  ChevronRight,
  ChevronLeft,
  Check,
  Search,
  Mail,
  BarChart3,
  Eye,
  Users,
  Zap
} from 'lucide-react'

const MINNESOTA_CITIES = [
  'Minneapolis', 'St Paul', 'Bloomington', 'Brooklyn Park', 'Plymouth',
  'Maple Grove', 'Woodbury', 'Eden Prairie', 'Burnsville', 'Lakeville',
  'Eagan', 'Blaine', 'Coon Rapids', 'Shakopee', 'Minnetonka',
  'Apple Valley', 'Edina', 'St Louis Park', 'Richfield', 'Roseville'
]

const HELP_OPTIONS = [
  {
    id: 'find_leads',
    title: 'Find new leads in my area',
    description: 'Scrape prospects from Yelp, Google Maps, and more',
    icon: Search,
    feature: 'Multi-Source Scraper',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    borderColor: 'border-blue-400'
  },
  {
    id: 'generate_audits',
    title: 'Generate marketing audits for prospects',
    description: 'Create AI-powered reports to wow potential clients',
    icon: Sparkles,
    feature: 'AI Report Generator',
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
    borderColor: 'border-cyan-400'
  },
  {
    id: 'cold_outreach',
    title: 'Send personalized cold outreach',
    description: 'Email prospects directly with Gmail integration',
    icon: Mail,
    feature: 'Cold Email Hub',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    borderColor: 'border-amber-400'
  },
  {
    id: 'score_leads',
    title: 'Score & prioritize my leads',
    description: 'AI-powered lead scoring based on website quality',
    icon: BarChart3,
    feature: 'Lead Scoring',
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
    borderColor: 'border-purple-400'
  },
  {
    id: 'monitor_competitors',
    title: 'Monitor competitor activity',
    description: 'Track market trends and competitor movements',
    icon: Eye,
    feature: 'Market Trends',
    color: 'text-green-400',
    bg: 'bg-green-400/10',
    borderColor: 'border-green-400'
  }
]

interface AnalysisResult {
  businessName: string
  industry: string
  services: string[]
  targetMarket: string
  location: string
  operationsSummary: string
  icpDescription: string
  icpPainPoints: string[]
  industryPainPoints: string[]
  suggestedIndustries: string[]
  suggestedCities: string[]
  confidence: number
}

export default function OnboardingPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [step, setStep] = useState(1)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [detectedIndustry, setDetectedIndustry] = useState('')
  const [selectedHelpAreas, setSelectedHelpAreas] = useState<string[]>([])
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
  const [selectedCities, setSelectedCities] = useState<string[]>([])
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)

  // Check if user already completed onboarding
  useEffect(() => {
    if (status === 'authenticated') {
      checkOnboardingStatus()
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  const checkOnboardingStatus = async () => {
    try {
      const res = await fetch('/api/onboarding/complete')
      const data = await res.json()
      if (data.onboardingCompleted) {
        router.push('/dashboard')
      }
    } catch (err) {
      console.error('Failed to check onboarding status:', err)
    }
  }

  const analyzeWebsite = async () => {
    if (!websiteUrl) {
      setError('Please enter your website URL')
      return
    }

    setIsAnalyzing(true)
    setError('')

    try {
      const res = await fetch('/api/onboarding/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: websiteUrl }),
      })

      if (!res.ok) {
        throw new Error('Analysis failed')
      }

      const result: AnalysisResult = await res.json()
      setAnalysisResult(result)
      setBusinessName(result.businessName)
      setDetectedIndustry(result.industry)
      setSelectedIndustries(result.suggestedIndustries.slice(0, 5))
      setSelectedCities(result.suggestedCities.slice(0, 8))
      setStep(2)
    } catch (err) {
      console.error('Analysis error:', err)
      setError('Failed to analyze website. You can continue manually.')
      setStep(2)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const skipAnalysis = () => {
    setSelectedIndustries(['Plumbing', 'HVAC', 'Roofing', 'Electrical', 'Landscaping'])
    setSelectedCities(['Minneapolis', 'St Paul', 'Bloomington', 'Plymouth', 'Edina'])
    setStep(2)
  }

  const toggleHelpArea = (id: string) => {
    setSelectedHelpAreas(prev =>
      prev.includes(id)
        ? prev.filter(h => h !== id)
        : [...prev, id]
    )
  }

  const toggleCity = (city: string) => {
    setSelectedCities(prev =>
      prev.includes(city)
        ? prev.filter(c => c !== city)
        : [...prev, city]
    )
  }

  const completeOnboarding = async () => {
    if (!businessName) {
      setError('Please enter your business name')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessUrl: websiteUrl,
          businessName,
          detectedIndustry,
          targetIndustries: selectedIndustries,
          targetCities: selectedCities,
          userGoal: selectedHelpAreas.join(','),
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to complete onboarding')
      }

      const data = await res.json()
      router.push(data.redirectTo || '/dashboard')
    } catch (err) {
      console.error('Onboarding error:', err)
      setError('Failed to save settings. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="dark min-h-screen flex items-center justify-center bg-[#0a0f1a]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    )
  }

  return (
    <div className="dark min-h-screen bg-[#0a0f1a] relative overflow-hidden">
      {/* Gradient mesh background */}
      <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-cyan-500/5 rounded-full blur-[150px]" />
      <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-amber-500/5 rounded-full blur-[150px]" />

      <div className="relative z-10 container max-w-4xl mx-auto px-4 py-12">
        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-12">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${step >= s
                    ? 'bg-gradient-to-br from-cyan-400 to-amber-400 text-[#0a0f1a]'
                    : 'bg-gray-800 text-gray-500'
                  }`}
              >
                {step > s ? <Check className="w-5 h-5" /> : s}
              </div>
              {s < 4 && (
                <div
                  className={`w-16 h-1 mx-2 rounded ${step > s ? 'bg-gradient-to-r from-cyan-400 to-amber-400' : 'bg-gray-800'
                    }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Website Analysis */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-amber-400/20 mb-6">
                <Globe className="w-8 h-8 text-cyan-400" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-3">
                Welcome to Prospect Intelligence
              </h1>
              <p className="text-gray-400 max-w-md mx-auto">
                Enter your website and we&apos;ll analyze your business to personalize your experience.
              </p>
            </div>

            <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl p-8">
              <Label htmlFor="website" className="text-white mb-2 block">
                Your Business Website
              </Label>
              <div className="flex gap-3">
                <Input
                  id="website"
                  type="text"
                  placeholder="yourcompany.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="flex-1 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                />
                <Button
                  onClick={analyzeWebsite}
                  disabled={isAnalyzing}
                  className="bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-[#0a0f1a] font-semibold px-6"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Analyze
                    </>
                  )}
                </Button>
              </div>

              {error && (
                <p className="mt-3 text-red-400 text-sm">{error}</p>
              )}

              <div className="mt-6 pt-6 border-t border-gray-800">
                <button
                  onClick={skipAnalysis}
                  className="text-gray-400 hover:text-white text-sm transition-colors"
                >
                  Skip this step and configure manually
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Business Context + Help Areas */}
        {step === 2 && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-amber-400/20 mb-6">
                <Building2 className="w-8 h-8 text-cyan-400" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-3">
                {analysisResult ? `Welcome, ${analysisResult.businessName}!` : 'About Your Business'}
              </h1>
              <p className="text-gray-400">
                {analysisResult
                  ? "Here's what we learned. Now tell us where you need help."
                  : "Tell us about your business and where you need help."}
              </p>
            </div>

            {/* Business Context Cards */}
            {analysisResult && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-medium text-cyan-400">Your Ideal Customer</span>
                  </div>
                  <p className="text-white text-sm leading-relaxed">{analysisResult.icpDescription}</p>
                </div>
                <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-medium text-amber-400">What They Struggle With</span>
                  </div>
                  <ul className="text-sm text-gray-300 space-y-1">
                    {analysisResult.icpPainPoints.slice(0, 3).map((point, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-400 mt-1">•</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Help Areas Selection */}
            <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl p-8">
              <h2 className="text-xl font-semibold text-white mb-2">Where are you looking for help?</h2>
              <p className="text-sm text-gray-500 mb-6">Select all that apply — we&apos;ll show you the right tools.</p>

              <div className="space-y-3">
                {HELP_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => toggleHelpArea(option.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${selectedHelpAreas.includes(option.id)
                        ? `${option.borderColor} ${option.bg}`
                        : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
                      }`}
                  >
                    <div className={`p-2.5 rounded-lg ${option.bg}`}>
                      <option.icon className={`w-5 h-5 ${option.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold ${selectedHelpAreas.includes(option.id) ? 'text-white' : 'text-gray-300'
                        }`}>
                        {option.title}
                      </p>
                      <p className="text-sm text-gray-500">{option.description}</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedHelpAreas.includes(option.id)
                        ? `${option.borderColor} ${option.bg}`
                        : 'border-gray-600'
                      }`}>
                      {selectedHelpAreas.includes(option.id) && (
                        <Check className={`w-3.5 h-3.5 ${option.color}`} />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {error && (
                <p className="mt-4 text-red-400 text-sm">{error}</p>
              )}

              <div className="flex justify-between pt-6 mt-6 border-t border-gray-800">
                <Button
                  variant="ghost"
                  onClick={() => setStep(1)}
                  className="text-gray-400 hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={() => {
                    if (selectedHelpAreas.length === 0) {
                      setError('Please select at least one area')
                      return
                    }
                    setError('')
                    setStep(3)
                  }}
                  className="bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-[#0a0f1a] font-semibold"
                >
                  Continue
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Confirm Target Areas (Cities) */}
        {step === 3 && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-amber-400/20 mb-6">
                <MapPin className="w-8 h-8 text-cyan-400" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-3">
                Confirm Your Target Areas
              </h1>
              <p className="text-gray-400">
                We&apos;ve pre-selected cities based on your location. Adjust if needed.
              </p>
            </div>

            <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl p-8">
              <div className="flex flex-wrap gap-2">
                {MINNESOTA_CITIES.map((city) => (
                  <button
                    key={city}
                    onClick={() => toggleCity(city)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${selectedCities.includes(city)
                        ? 'border-amber-400 bg-amber-400/10 text-amber-400'
                        : 'border-gray-700 bg-gray-800/30 text-gray-400 hover:border-gray-600'
                      }`}
                  >
                    {selectedCities.includes(city) && (
                      <Check className="w-3 h-3 inline mr-1" />
                    )}
                    {city}
                  </button>
                ))}
              </div>

              <p className="mt-4 text-sm text-gray-500">
                Selected: {selectedCities.length} cities
              </p>

              {/* Industries confirmation (read-only preview) */}
              {selectedIndustries.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-800">
                  <p className="text-sm text-gray-400 mb-3">Target industries (auto-detected):</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedIndustries.map((ind) => (
                      <span key={ind} className="px-3 py-1 rounded-full bg-cyan-400/10 text-cyan-400 text-xs font-medium">
                        {ind}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-6 mt-6 border-t border-gray-800">
                <Button
                  variant="ghost"
                  onClick={() => setStep(2)}
                  className="text-gray-400 hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={() => setStep(4)}
                  className="bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-[#0a0f1a] font-semibold"
                >
                  Continue
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Feature Showcase */}
        {step === 4 && (
          <div className="space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-amber-400/20 mb-6">
                <Sparkles className="w-8 h-8 text-cyan-400" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-3">
                You&apos;re All Set!
              </h1>
              <p className="text-gray-400">
                Here are the tools we&apos;ve unlocked based on your selections.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {HELP_OPTIONS.filter(opt => selectedHelpAreas.includes(opt.id)).map((feature, i) => (
                <div key={i} className="bg-gray-900/50 backdrop-blur border border-gray-800 p-6 rounded-2xl flex gap-4">
                  <div className={`p-3 rounded-xl ${feature.bg} h-fit`}>
                    <feature.icon className={`w-5 h-5 ${feature.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{feature.feature}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Show remaining features they didn't select */}
            {HELP_OPTIONS.filter(opt => !selectedHelpAreas.includes(opt.id)).length > 0 && (
              <div className="pt-4">
                <p className="text-sm text-gray-500 mb-3">Also available to explore:</p>
                <div className="flex flex-wrap gap-2">
                  {HELP_OPTIONS.filter(opt => !selectedHelpAreas.includes(opt.id)).map((feature) => (
                    <span key={feature.id} className="px-3 py-1.5 rounded-full bg-gray-800 text-gray-400 text-xs font-medium flex items-center gap-1.5">
                      <feature.icon className="w-3 h-3" />
                      {feature.feature}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-6 mt-6 border-t border-gray-800">
              <Button
                variant="ghost"
                onClick={() => setStep(3)}
                className="text-gray-400 hover:text-white"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={completeOnboarding}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-cyan-500 to-amber-400 hover:from-cyan-400 hover:to-amber-300 text-[#0a0f1a] font-semibold px-8"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Finalizing...
                  </>
                ) : (
                  <>
                    Go to Dashboard
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
