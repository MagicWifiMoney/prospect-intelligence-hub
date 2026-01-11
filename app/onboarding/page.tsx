'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Loader2,
  Globe,
  Target,
  MapPin,
  Sparkles,
  Building2,
  TrendingUp,
  Users,
  ChevronRight,
  ChevronLeft,
  Check
} from 'lucide-react'

const MINNESOTA_CITIES = [
  'Minneapolis', 'St Paul', 'Bloomington', 'Brooklyn Park', 'Plymouth',
  'Maple Grove', 'Woodbury', 'Eden Prairie', 'Burnsville', 'Lakeville',
  'Eagan', 'Blaine', 'Coon Rapids', 'Shakopee', 'Minnetonka',
  'Apple Valley', 'Edina', 'St Louis Park', 'Richfield', 'Roseville'
]

const SERVICE_INDUSTRIES = [
  'Plumbing', 'HVAC', 'Electrical', 'Roofing', 'Garage Door',
  'Pest Control', 'Landscaping', 'Tree Service', 'Concrete',
  'Fence', 'Gutter', 'Painting', 'Remodeling', 'Foundation Repair',
  'Water Damage Restoration', 'Locksmith', 'Cleaning Services'
]

const USER_GOALS = [
  {
    id: 'find_leads',
    title: 'Find New Leads',
    description: 'Discover high-quality prospects in my service area',
    icon: Target,
  },
  {
    id: 'monitor_competitors',
    title: 'Monitor Competitors',
    description: 'Track competitor activity and market changes',
    icon: TrendingUp,
  },
  {
    id: 'grow_agency',
    title: 'Grow My Agency',
    description: 'Find clients who need marketing help',
    icon: Users,
  },
]

interface AnalysisResult {
  businessName: string
  industry: string
  services: string[]
  targetMarket: string
  location: string
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
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
  const [selectedCities, setSelectedCities] = useState<string[]>([])
  const [userGoal, setUserGoal] = useState('')
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

  const toggleIndustry = (industry: string) => {
    setSelectedIndustries(prev =>
      prev.includes(industry)
        ? prev.filter(i => i !== industry)
        : [...prev, industry]
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
    if (!userGoal) {
      setError('Please select your primary goal')
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
          userGoal,
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

      <div className="relative z-10 container max-w-3xl mx-auto px-4 py-12">
        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-12">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  step >= s
                    ? 'bg-gradient-to-br from-cyan-400 to-amber-400 text-[#0a0f1a]'
                    : 'bg-gray-800 text-gray-500'
                }`}
              >
                {step > s ? <Check className="w-5 h-5" /> : s}
              </div>
              {s < 4 && (
                <div
                  className={`w-16 h-1 mx-2 rounded ${
                    step > s ? 'bg-gradient-to-r from-cyan-400 to-amber-400' : 'bg-gray-800'
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
                Let&apos;s personalize your experience. Enter your website and we&apos;ll
                automatically configure your dashboard.
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
                      <Sparkles className="w-4 h-4 mr-2" />
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

        {/* Step 2: Business Details */}
        {step === 2 && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-amber-400/20 mb-6">
                <Building2 className="w-8 h-8 text-cyan-400" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-3">
                About Your Business
              </h1>
              <p className="text-gray-400">
                {analysisResult
                  ? "We've detected some details. Feel free to adjust them."
                  : "Tell us about your business to personalize your experience."}
              </p>
            </div>

            <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl p-8 space-y-6">
              <div>
                <Label htmlFor="businessName" className="text-white mb-2 block">
                  Business Name
                </Label>
                <Input
                  id="businessName"
                  type="text"
                  placeholder="Your Company Name"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>

              <div>
                <Label className="text-white mb-2 block">
                  Your Primary Goal
                </Label>
                <div className="grid gap-3">
                  {USER_GOALS.map((goal) => (
                    <button
                      key={goal.id}
                      onClick={() => setUserGoal(goal.id)}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                        userGoal === goal.id
                          ? 'border-cyan-400 bg-cyan-400/10'
                          : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${
                        userGoal === goal.id ? 'bg-cyan-400/20' : 'bg-gray-700/50'
                      }`}>
                        <goal.icon className={`w-5 h-5 ${
                          userGoal === goal.id ? 'text-cyan-400' : 'text-gray-400'
                        }`} />
                      </div>
                      <div>
                        <p className={`font-semibold ${
                          userGoal === goal.id ? 'text-white' : 'text-gray-300'
                        }`}>
                          {goal.title}
                        </p>
                        <p className="text-sm text-gray-500">{goal.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}

              <div className="flex justify-between pt-4">
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
                    if (!businessName || !userGoal) {
                      setError('Please fill in all fields')
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

        {/* Step 3: Target Industries */}
        {step === 3 && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-amber-400/20 mb-6">
                <Target className="w-8 h-8 text-cyan-400" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-3">
                Target Industries
              </h1>
              <p className="text-gray-400">
                Select the service industries you want to monitor for leads.
              </p>
            </div>

            <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl p-8">
              <div className="flex flex-wrap gap-2">
                {SERVICE_INDUSTRIES.map((industry) => (
                  <button
                    key={industry}
                    onClick={() => toggleIndustry(industry)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                      selectedIndustries.includes(industry)
                        ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400'
                        : 'border-gray-700 bg-gray-800/30 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    {selectedIndustries.includes(industry) && (
                      <Check className="w-3 h-3 inline mr-1" />
                    )}
                    {industry}
                  </button>
                ))}
              </div>

              <p className="mt-4 text-sm text-gray-500">
                Selected: {selectedIndustries.length} industries
              </p>

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

        {/* Step 4: Target Cities */}
        {step === 4 && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-amber-400/20 mb-6">
                <MapPin className="w-8 h-8 text-cyan-400" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-3">
                Target Areas
              </h1>
              <p className="text-gray-400">
                Select the Minnesota cities you want to focus on.
              </p>
            </div>

            <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl p-8">
              <div className="flex flex-wrap gap-2">
                {MINNESOTA_CITIES.map((city) => (
                  <button
                    key={city}
                    onClick={() => toggleCity(city)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                      selectedCities.includes(city)
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

              {error && (
                <p className="mt-4 text-red-400 text-sm">{error}</p>
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
                      Setting up...
                    </>
                  ) : (
                    <>
                      Complete Setup
                      <Sparkles className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
