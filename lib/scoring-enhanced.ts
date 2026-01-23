import { Prospect } from '@/prisma/generated/client'

// Keywords that indicate high-ticket/commercial business
const HIGH_TICKET_KEYWORDS = {
  commercial: ['commercial', 'industrial', 'business', 'corporate', 'enterprise', 'fleet', 'contract', 'B2B'],
  premium: ['premium', 'luxury', 'custom', 'high-end', 'professional', 'certified', 'licensed', 'insured'],
  scale: ['24/7', '24 hour', 'emergency', 'same day', 'fleet', 'multiple locations', 'serving', 'franchise'],
}

// Essential/boring but profitable business types
const BORING_GOLDMINE_TYPES = [
  'plumber', 'plumbing',
  'hvac', 'heating', 'cooling', 'air conditioning',
  'electrician', 'electrical',
  'roofing', 'roofer',
  'garage door',
  'pest control',
  'locksmith',
  'septic',
  'foundation',
  'water damage', 'restoration',
  'tree service', 'tree removal',
  'concrete',
  'excavation',
  'paving', 'asphalt',
  'fence', 'fencing',
  'gutter',
  'insulation',
  'waterproofing',
]

// High-value lead gen niches (estimated lead value in $)
const LEAD_VALUE_BY_CATEGORY: Record<string, number> = {
  'roofing': 150,
  'hvac': 100,
  'plumbing': 80,
  'electrical': 75,
  'foundation': 200,
  'water damage': 175,
  'restoration': 150,
  'garage door': 60,
  'pest control': 40,
  'tree service': 70,
  'concrete': 100,
  'paving': 120,
  'fence': 50,
  'gutter': 45,
  'insulation': 80,
  'waterproofing': 90,
  'septic': 100,
  'excavation': 150,
  'locksmith': 35,
  'default': 50,
}

export interface ScoringFactors {
  highTicket: {
    commercialFocus: number
    priceIndicators: number
    scaleSignals: number
    industryValue: number
    total: number
  }
  opportunity: {
    websiteGap: number
    marketingGap: number
    competitorWeakness: number
    growthPotential: number
    total: number
  }
  leadGen: {
    searchVolume: number
    competitionLevel: number
    monetization: number
    geographicOpportunity: number
    total: number
  }
}

export interface EnhancedScores {
  highTicketScore: number
  opportunityScore: number
  leadGenScore: number
  opportunityTags: string[]
  scoringFactors: ScoringFactors
}

/**
 * Calculate High-Ticket Score (0-100)
 * Identifies businesses likely to have high-value customers/projects
 */
function calculateHighTicketScore(prospect: Prospect): { score: number; factors: ScoringFactors['highTicket'] } {
  const factors = {
    commercialFocus: 0,
    priceIndicators: 0,
    scaleSignals: 0,
    industryValue: 0,
    total: 0,
  }

  const searchText = [
    prospect.companyName,
    prospect.businessType,
    prospect.categories,
    prospect.recentReviews,
    prospect.qualificationSignals,
  ].filter(Boolean).join(' ').toLowerCase()

  // Commercial Focus (25 points)
  // Check for B2B/commercial keywords
  const commercialMatches = HIGH_TICKET_KEYWORDS.commercial.filter(kw => searchText.includes(kw.toLowerCase()))
  factors.commercialFocus = Math.min(commercialMatches.length * 8, 25)

  // Price Indicators (25 points)
  // Premium keywords suggest higher-ticket work
  const premiumMatches = HIGH_TICKET_KEYWORDS.premium.filter(kw => searchText.includes(kw.toLowerCase()))
  factors.priceIndicators = Math.min(premiumMatches.length * 6, 25)

  // Scale Signals (25 points)
  // Indicators of larger operation
  const scaleMatches = HIGH_TICKET_KEYWORDS.scale.filter(kw => searchText.includes(kw.toLowerCase()))
  let scaleScore = scaleMatches.length * 5

  // High review count suggests established, larger business
  if (prospect.reviewCount && prospect.reviewCount > 100) scaleScore += 10
  else if (prospect.reviewCount && prospect.reviewCount > 50) scaleScore += 5

  // Employee count if available
  if (prospect.employeeCount && prospect.employeeCount > 10) scaleScore += 10
  else if (prospect.employeeCount && prospect.employeeCount > 5) scaleScore += 5

  factors.scaleSignals = Math.min(scaleScore, 25)

  // Industry Value (25 points)
  // Some industries naturally have higher ticket sizes
  const businessType = (prospect.businessType || prospect.categories || '').toLowerCase()
  const highValueIndustries = ['roofing', 'hvac', 'foundation', 'restoration', 'commercial', 'industrial', 'remodel', 'construction']
  const medValueIndustries = ['plumbing', 'electrical', 'concrete', 'paving', 'excavation']

  if (highValueIndustries.some(ind => businessType.includes(ind))) {
    factors.industryValue = 25
  } else if (medValueIndustries.some(ind => businessType.includes(ind))) {
    factors.industryValue = 15
  } else {
    factors.industryValue = 8
  }

  factors.total = factors.commercialFocus + factors.priceIndicators + factors.scaleSignals + factors.industryValue
  return { score: Math.min(factors.total, 100), factors }
}

/**
 * Calculate Opportunity Score (0-100)
 * Identifies businesses with marketing gaps = sales opportunities
 */
function calculateOpportunityScore(prospect: Prospect): { score: number; factors: ScoringFactors['opportunity'] } {
  const factors = {
    websiteGap: 0,
    marketingGap: 0,
    competitorWeakness: 0,
    growthPotential: 0,
    total: 0,
  }

  // Website Gap (30 points)
  // No website or obviously basic website = huge opportunity
  if (!prospect.website) {
    factors.websiteGap = 30
  } else if (prospect.needsWebsite) {
    factors.websiteGap = 25 // Detected as "needs website" by tech scraper
  } else if (prospect.website && !prospect.website.includes('http')) {
    factors.websiteGap = 20 // Might be incomplete/broken
  } else if (!prospect.hasCMS) {
    factors.websiteGap = 15 // Has site but no modern CMS
  } else {
    factors.websiteGap = 5 // Has website but might still need help
  }

  // Marketing Gap (30 points)
  // Check for missing social media, no ads presence, etc.
  let marketingScore = 0

  // No social media presence (extracted from contact scraper or GB)
  const hasSocials = prospect.facebook || prospect.instagram || prospect.linkedin ||
    prospect.companyFacebook || prospect.companyInstagram || prospect.companyLinkedIn

  if (!hasSocials) {
    marketingScore += 15
  } else if (!(prospect.facebook || prospect.companyFacebook) || !(prospect.instagram || prospect.companyInstagram)) {
    marketingScore += 8
  }

  // Missing conversion/tracking tools (from tech stack)
  if (!prospect.hasAnalytics) {
    marketingScore += 7 // No tracking = flying blind
  }
  if (!prospect.hasLiveChat && !prospect.hasBookingWidget) {
    marketingScore += 5 // No easy way to capture leads
  }

  // No email listed (harder to do email marketing)
  if (!prospect.email && !prospect.additionalEmails?.length) {
    marketingScore += 5
  }

  // Low review count despite being established
  if (prospect.googleRating && prospect.googleRating >= 4.0 && prospect.reviewCount && prospect.reviewCount < 20) {
    marketingScore += 10 // Good service, not asking for reviews
  }

  factors.marketingGap = Math.min(marketingScore, 30)


  // Competitor Weakness (20 points)
  // This is harder to determine without competitor data, but we can infer
  // Businesses in areas with few prospects might have less competition
  // For now, we'll give partial points
  factors.competitorWeakness = 10 // Placeholder - would need market data

  // Growth Potential (20 points)
  // Good rating + established = room to grow
  let growthScore = 0

  if (prospect.googleRating && prospect.googleRating >= 4.5) {
    growthScore += 10 // Great service, can handle more customers
  } else if (prospect.googleRating && prospect.googleRating >= 4.0) {
    growthScore += 5
  }

  if (prospect.reviewCount && prospect.reviewCount >= 50) {
    growthScore += 5 // Established business
  }

  // Essential service = always in demand
  const businessType = (prospect.businessType || prospect.categories || '').toLowerCase()
  if (BORING_GOLDMINE_TYPES.some(type => businessType.includes(type))) {
    growthScore += 5
  }

  factors.growthPotential = Math.min(growthScore, 20)

  factors.total = factors.websiteGap + factors.marketingGap + factors.competitorWeakness + factors.growthPotential
  return { score: Math.min(factors.total, 100), factors }
}

/**
 * Calculate Lead Gen Score (0-100)
 * Identifies niches/categories worth building a lead gen site for
 */
function calculateLeadGenScore(prospect: Prospect): { score: number; factors: ScoringFactors['leadGen'] } {
  const factors = {
    searchVolume: 0,
    competitionLevel: 0,
    monetization: 0,
    geographicOpportunity: 0,
    total: 0,
  }

  const businessType = (prospect.businessType || prospect.categories || '').toLowerCase()
  const city = (prospect.city || '').toLowerCase()

  // Search Volume (30 points)
  // Essential services have consistent search demand
  if (BORING_GOLDMINE_TYPES.some(type => businessType.includes(type))) {
    factors.searchVolume = 25 // High-demand services
  } else {
    factors.searchVolume = 10 // Lower but still viable
  }

  // Competition Level (30 points)
  // Harder to assess without actual SEO data, using proxies
  // If business has low online presence, competition might be low
  let competitionScore = 15 // Base score

  // Smaller cities often have less SEO competition
  const smallerCities = ['burnsville', 'lakeville', 'shakopee', 'brooklyn park', 'maple grove', 'woodbury', 'eden prairie', 'plymouth', 'coon rapids', 'blaine']
  if (smallerCities.some(c => city.includes(c))) {
    competitionScore += 10
  }

  factors.competitionLevel = Math.min(competitionScore, 30)

  // Monetization (20 points)
  // Higher-value leads = more profitable lead gen
  let leadValue = LEAD_VALUE_BY_CATEGORY['default']
  for (const [category, value] of Object.entries(LEAD_VALUE_BY_CATEGORY)) {
    if (businessType.includes(category)) {
      leadValue = Math.max(leadValue, value)
    }
  }

  if (leadValue >= 150) {
    factors.monetization = 20
  } else if (leadValue >= 100) {
    factors.monetization = 15
  } else if (leadValue >= 75) {
    factors.monetization = 10
  } else {
    factors.monetization = 5
  }

  // Geographic Opportunity (20 points)
  // Minnesota focus - Minneapolis suburbs have good opportunity
  const mnMetro = ['minneapolis', 'st paul', 'saint paul', 'bloomington', 'brooklyn park', 'plymouth', 'maple grove', 'woodbury', 'eden prairie', 'burnsville', 'lakeville', 'eagan', 'blaine', 'coon rapids', 'shakopee', 'minnetonka', 'richfield', 'fridley', 'brooklyn center']

  if (mnMetro.some(c => city.includes(c))) {
    factors.geographicOpportunity = 20
  } else if (city.includes('mn') || city.includes('minnesota')) {
    factors.geographicOpportunity = 15
  } else {
    factors.geographicOpportunity = 10
  }

  factors.total = factors.searchVolume + factors.competitionLevel + factors.monetization + factors.geographicOpportunity
  return { score: Math.min(factors.total, 100), factors }
}

/**
 * Determine opportunity tags based on scores
 */
function determineOpportunityTags(
  highTicketScore: number,
  opportunityScore: number,
  leadGenScore: number,
  prospect: Prospect
): string[] {
  const tags: string[] = []

  // High Ticket tag
  if (highTicketScore >= 60) {
    tags.push('high_ticket')
  }

  // Boring Goldmine tag
  const businessType = (prospect.businessType || prospect.categories || '').toLowerCase()
  const isBoringBusiness = BORING_GOLDMINE_TYPES.some(type => businessType.includes(type))
  const isEstablished = (prospect.reviewCount || 0) >= 30
  const hasMarketingGap = opportunityScore >= 50

  if (isBoringBusiness && isEstablished && hasMarketingGap) {
    tags.push('boring_goldmine')
  }

  // Lead Gen Opportunity tag
  if (leadGenScore >= 65) {
    tags.push('leadgen_opportunity')
  }

  // Quick Win tag - easy to close
  if (opportunityScore >= 70 && (prospect.googleRating || 0) >= 4.5) {
    tags.push('quick_win')
  }

  // Website Needed tag
  if (!prospect.website) {
    tags.push('needs_website')
  }

  // Social Media Needed tag
  if (!prospect.facebook && !prospect.instagram) {
    tags.push('needs_social')
  }

  return tags
}

/**
 * Calculate all enhanced scores for a prospect
 */
export function calculateEnhancedScores(prospect: Prospect): EnhancedScores {
  const highTicket = calculateHighTicketScore(prospect)
  const opportunity = calculateOpportunityScore(prospect)
  const leadGen = calculateLeadGenScore(prospect)

  const tags = determineOpportunityTags(
    highTicket.score,
    opportunity.score,
    leadGen.score,
    prospect
  )

  return {
    highTicketScore: highTicket.score,
    opportunityScore: opportunity.score,
    leadGenScore: leadGen.score,
    opportunityTags: tags,
    scoringFactors: {
      highTicket: highTicket.factors,
      opportunity: opportunity.factors,
      leadGen: leadGen.factors,
    },
  }
}

/**
 * Get category lead value for aggregation
 */
export function getCategoryLeadValue(businessType: string): number {
  const type = businessType.toLowerCase()
  for (const [category, value] of Object.entries(LEAD_VALUE_BY_CATEGORY)) {
    if (type.includes(category)) {
      return value
    }
  }
  return LEAD_VALUE_BY_CATEGORY['default']
}

export { BORING_GOLDMINE_TYPES, LEAD_VALUE_BY_CATEGORY, HIGH_TICKET_KEYWORDS }
