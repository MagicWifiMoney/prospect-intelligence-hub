import { Prospect, IcpSegment } from '@/prisma/generated/client'

/**
 * Schema for ICP segment rules stored in JSON
 */
export interface SegmentRules {
  // Score filters
  minIcpScore?: number      // e.g., 70
  maxIcpScore?: number
  minLeadScore?: number
  maxLeadScore?: number
  minOpportunityScore?: number
  maxOpportunityScore?: number

  // Business filters
  businessTypes?: string[]  // ["Painter", "HVAC", "Roofing"]
  cities?: string[]

  // Gap filters
  hasWebsite?: boolean      // false = no website (opportunity)
  hasEmail?: boolean        // true = must have email for outreach
  minReviews?: number
  maxReviews?: number
  minRating?: number
  maxRating?: number

  // Tech stack filters
  needsWebsite?: boolean    // Prospects without a website
  hasCMS?: boolean

  // Status filters
  isContacted?: boolean     // false = not yet contacted
  isConverted?: boolean
  isHotLead?: boolean
}

/**
 * Type for prospect data used in rule matching
 */
export type ProspectForMatching = Pick<Prospect,
  | 'id'
  | 'icpScore'
  | 'leadScore'
  | 'opportunityScore'
  | 'businessType'
  | 'city'
  | 'website'
  | 'email'
  | 'reviewCount'
  | 'googleRating'
  | 'needsWebsite'
  | 'hasCMS'
  | 'contactedAt'
  | 'isConverted'
  | 'isHotLead'
>

/**
 * Check if a prospect matches a set of segment rules
 */
export function matchesSegmentRules(
  prospect: ProspectForMatching,
  rules: SegmentRules
): boolean {
  // Score filters
  if (rules.minIcpScore !== undefined) {
    if (!prospect.icpScore || prospect.icpScore < rules.minIcpScore) {
      return false
    }
  }
  if (rules.maxIcpScore !== undefined) {
    if (prospect.icpScore && prospect.icpScore > rules.maxIcpScore) {
      return false
    }
  }

  if (rules.minLeadScore !== undefined) {
    if (!prospect.leadScore || prospect.leadScore < rules.minLeadScore) {
      return false
    }
  }
  if (rules.maxLeadScore !== undefined) {
    if (prospect.leadScore && prospect.leadScore > rules.maxLeadScore) {
      return false
    }
  }

  if (rules.minOpportunityScore !== undefined) {
    if (!prospect.opportunityScore || prospect.opportunityScore < rules.minOpportunityScore) {
      return false
    }
  }
  if (rules.maxOpportunityScore !== undefined) {
    if (prospect.opportunityScore && prospect.opportunityScore > rules.maxOpportunityScore) {
      return false
    }
  }

  // Business type filter
  if (rules.businessTypes && rules.businessTypes.length > 0) {
    if (!prospect.businessType) {
      return false
    }
    const prospectType = prospect.businessType.toLowerCase()
    const matchesType = rules.businessTypes.some(
      (t) => prospectType.includes(t.toLowerCase())
    )
    if (!matchesType) {
      return false
    }
  }

  // City filter
  if (rules.cities && rules.cities.length > 0) {
    if (!prospect.city) {
      return false
    }
    const prospectCity = prospect.city.toLowerCase()
    const matchesCity = rules.cities.some(
      (c) => prospectCity.includes(c.toLowerCase())
    )
    if (!matchesCity) {
      return false
    }
  }

  // Website filter
  if (rules.hasWebsite === true && !prospect.website) {
    return false
  }
  if (rules.hasWebsite === false && prospect.website) {
    return false
  }

  // Email filter (for outreach)
  if (rules.hasEmail === true && !prospect.email) {
    return false
  }

  // Review count filter
  if (rules.minReviews !== undefined) {
    if (!prospect.reviewCount || prospect.reviewCount < rules.minReviews) {
      return false
    }
  }
  if (rules.maxReviews !== undefined) {
    if (prospect.reviewCount && prospect.reviewCount > rules.maxReviews) {
      return false
    }
  }

  // Rating filter
  if (rules.minRating !== undefined) {
    if (!prospect.googleRating || prospect.googleRating < rules.minRating) {
      return false
    }
  }
  if (rules.maxRating !== undefined) {
    if (prospect.googleRating && prospect.googleRating > rules.maxRating) {
      return false
    }
  }

  // Needs website filter
  if (rules.needsWebsite === true && prospect.needsWebsite !== true) {
    return false
  }
  if (rules.needsWebsite === false && prospect.needsWebsite === true) {
    return false
  }

  // CMS filter
  if (rules.hasCMS === true && prospect.hasCMS !== true) {
    return false
  }
  if (rules.hasCMS === false && prospect.hasCMS === true) {
    return false
  }

  // Contact status filter
  if (rules.isContacted === true && !prospect.contactedAt) {
    return false
  }
  if (rules.isContacted === false && prospect.contactedAt) {
    return false
  }

  // Conversion filter
  if (rules.isConverted === true && prospect.isConverted !== true) {
    return false
  }
  if (rules.isConverted === false && prospect.isConverted === true) {
    return false
  }

  // Hot lead filter
  if (rules.isHotLead === true && prospect.isHotLead !== true) {
    return false
  }
  if (rules.isHotLead === false && prospect.isHotLead === true) {
    return false
  }

  return true
}

/**
 * Build a Prisma where clause from segment rules
 * This allows efficient database-level filtering
 */
export function buildPrismaWhereFromRules(rules: SegmentRules): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {}

  // Score filters
  if (rules.minIcpScore !== undefined || rules.maxIcpScore !== undefined) {
    where.icpScore = {}
    if (rules.minIcpScore !== undefined) where.icpScore.gte = rules.minIcpScore
    if (rules.maxIcpScore !== undefined) where.icpScore.lte = rules.maxIcpScore
  }

  if (rules.minLeadScore !== undefined || rules.maxLeadScore !== undefined) {
    where.leadScore = {}
    if (rules.minLeadScore !== undefined) where.leadScore.gte = rules.minLeadScore
    if (rules.maxLeadScore !== undefined) where.leadScore.lte = rules.maxLeadScore
  }

  if (rules.minOpportunityScore !== undefined || rules.maxOpportunityScore !== undefined) {
    where.opportunityScore = {}
    if (rules.minOpportunityScore !== undefined) where.opportunityScore.gte = rules.minOpportunityScore
    if (rules.maxOpportunityScore !== undefined) where.opportunityScore.lte = rules.maxOpportunityScore
  }

  // Business type filter (OR condition for multiple types)
  if (rules.businessTypes && rules.businessTypes.length > 0) {
    where.OR = rules.businessTypes.map((t) => ({
      businessType: { contains: t, mode: 'insensitive' }
    }))
  }

  // City filter (OR condition for multiple cities)
  if (rules.cities && rules.cities.length > 0) {
    const cityConditions = rules.cities.map((c) => ({
      city: { contains: c, mode: 'insensitive' }
    }))
    if (where.OR) {
      // Combine with business type filter using AND
      where.AND = [{ OR: where.OR }, { OR: cityConditions }]
      delete where.OR
    } else {
      where.OR = cityConditions
    }
  }

  // Website filter
  if (rules.hasWebsite === true) {
    where.website = { not: null }
  } else if (rules.hasWebsite === false) {
    where.website = null
  }

  // Email filter
  if (rules.hasEmail === true) {
    where.email = { not: null }
  }

  // Review count filter
  if (rules.minReviews !== undefined || rules.maxReviews !== undefined) {
    where.reviewCount = {}
    if (rules.minReviews !== undefined) where.reviewCount.gte = rules.minReviews
    if (rules.maxReviews !== undefined) where.reviewCount.lte = rules.maxReviews
  }

  // Rating filter
  if (rules.minRating !== undefined || rules.maxRating !== undefined) {
    where.googleRating = {}
    if (rules.minRating !== undefined) where.googleRating.gte = rules.minRating
    if (rules.maxRating !== undefined) where.googleRating.lte = rules.maxRating
  }

  // Needs website filter
  if (rules.needsWebsite !== undefined) {
    where.needsWebsite = rules.needsWebsite
  }

  // CMS filter
  if (rules.hasCMS !== undefined) {
    where.hasCMS = rules.hasCMS
  }

  // Contact status filter
  if (rules.isContacted === true) {
    where.contactedAt = { not: null }
  } else if (rules.isContacted === false) {
    where.contactedAt = null
  }

  // Conversion filter
  if (rules.isConverted !== undefined) {
    where.isConverted = rules.isConverted
  }

  // Hot lead filter
  if (rules.isHotLead !== undefined) {
    where.isHotLead = rules.isHotLead
  }

  return where
}

/**
 * Get a human-readable summary of segment rules
 */
export function getSegmentRulesSummary(rules: SegmentRules): string[] {
  const summary: string[] = []

  if (rules.minIcpScore !== undefined) {
    summary.push(`ICP Score >= ${rules.minIcpScore}`)
  }
  if (rules.maxIcpScore !== undefined) {
    summary.push(`ICP Score <= ${rules.maxIcpScore}`)
  }
  if (rules.minLeadScore !== undefined) {
    summary.push(`Lead Score >= ${rules.minLeadScore}`)
  }
  if (rules.businessTypes && rules.businessTypes.length > 0) {
    summary.push(`Business: ${rules.businessTypes.join(', ')}`)
  }
  if (rules.cities && rules.cities.length > 0) {
    summary.push(`Cities: ${rules.cities.join(', ')}`)
  }
  if (rules.hasWebsite === false) {
    summary.push('No website')
  } else if (rules.hasWebsite === true) {
    summary.push('Has website')
  }
  if (rules.hasEmail === true) {
    summary.push('Has email')
  }
  if (rules.minReviews !== undefined) {
    summary.push(`Reviews >= ${rules.minReviews}`)
  }
  if (rules.minRating !== undefined) {
    summary.push(`Rating >= ${rules.minRating}`)
  }
  if (rules.isContacted === false) {
    summary.push('Not contacted')
  }
  if (rules.isHotLead === true) {
    summary.push('Hot leads only')
  }
  if (rules.needsWebsite === true) {
    summary.push('Needs website')
  }

  return summary
}

/**
 * Validate segment rules schema
 */
export function validateSegmentRules(rules: unknown): rules is SegmentRules {
  if (!rules || typeof rules !== 'object') {
    return false
  }

  const r = rules as Record<string, unknown>

  // Check numeric fields
  const numericFields = [
    'minIcpScore', 'maxIcpScore', 'minLeadScore', 'maxLeadScore',
    'minOpportunityScore', 'maxOpportunityScore', 'minReviews', 'maxReviews',
    'minRating', 'maxRating'
  ]
  for (const field of numericFields) {
    if (r[field] !== undefined && typeof r[field] !== 'number') {
      return false
    }
  }

  // Check boolean fields
  const booleanFields = [
    'hasWebsite', 'hasEmail', 'needsWebsite', 'hasCMS',
    'isContacted', 'isConverted', 'isHotLead'
  ]
  for (const field of booleanFields) {
    if (r[field] !== undefined && typeof r[field] !== 'boolean') {
      return false
    }
  }

  // Check array fields
  const arrayFields = ['businessTypes', 'cities']
  for (const field of arrayFields) {
    if (r[field] !== undefined) {
      if (!Array.isArray(r[field])) {
        return false
      }
      if (!(r[field] as unknown[]).every((item) => typeof item === 'string')) {
        return false
      }
    }
  }

  return true
}
