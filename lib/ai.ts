import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// Use Gemini 2.0 Flash for cost-effective generation (~$0.001/report)
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

export interface ProspectReportData {
    companyName: string
    city: string
    state?: string
    businessType: string
    googleRating?: number | null
    reviewCount?: number | null
    yelpRating?: number | null
    yelpReviewCount?: number | null
    website?: string | null
    hasWebsite: boolean
    employeeCount?: number | null
    categories?: string | null
}

export interface GeneratedReport {
    headline: string
    strengths: string[]
    opportunities: string[]
    competitorInsights: string
    ctaText: string
    estimatedValue: string
}

/**
 * Generate a personalized marketing audit report for a prospect
 * Cost: ~$0.001 per report using Gemini 2.0 Flash
 */
export async function generateProspectReport(
    prospect: ProspectReportData
): Promise<GeneratedReport> {
    const prompt = `You are a marketing consultant creating a personalized audit report for a small business.

BUSINESS INFO:
- Company: ${prospect.companyName}
- Location: ${prospect.city}, ${prospect.state || 'MN'}
- Industry: ${prospect.businessType}
- Google Rating: ${prospect.googleRating || 'Not found'} (${prospect.reviewCount || 0} reviews)
- Yelp Rating: ${prospect.yelpRating || 'Not found'} (${prospect.yelpReviewCount || 0} reviews)
- Website: ${prospect.hasWebsite ? prospect.website : 'No website found'}
- Employee Count: ${prospect.employeeCount || 'Unknown'}

Generate a JSON report with these exact fields:
{
  "headline": "A compelling 1-line hook about their situation (max 15 words)",
  "strengths": ["2-3 specific positive things about their business"],
  "opportunities": ["3-4 specific marketing gaps or problems they have"],
  "competitorInsights": "1-2 sentences about how competitors are outranking them despite worse reviews",
  "ctaText": "A compelling call-to-action button text (max 6 words)",
  "estimatedValue": "Estimated monthly revenue they're losing (e.g., '$2,000-5,000/month')"
}

Rules:
- Be specific and reference their actual data
- Make opportunities actionable and believable
- Keep everything concise and punchy
- Focus on local SEO and digital presence gaps

Return ONLY valid JSON, no markdown.`

    try {
        const result = await model.generateContent(prompt)
        const response = result.response
        const text = response.text()

        // Parse JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            throw new Error('No JSON found in response')
        }

        const report = JSON.parse(jsonMatch[0]) as GeneratedReport
        return report
    } catch (error) {
        console.error('Error generating report:', error)

        // Fallback report if AI fails
        return {
            headline: `${prospect.companyName} Has Untapped Growth Potential`,
            strengths: [
                prospect.googleRating ? `Strong ${prospect.googleRating}-star rating on Google` : 'Established local presence',
                `Located in ${prospect.city} market`,
            ],
            opportunities: [
                'Not appearing in Google Map Pack for key searches',
                prospect.hasWebsite ? 'Website needs SEO optimization' : 'No website - missing 70% of customers who search online',
                'Competitors with worse reviews are ranking higher',
            ],
            competitorInsights: 'Businesses with lower ratings are capturing more leads because they have optimized their online presence.',
            ctaText: 'Get Your Free Strategy Call',
            estimatedValue: '$1,500-4,000/month',
        }
    }
}

/**
 * Check if Gemini API is configured
 */
export function isAIConfigured(): boolean {
    return !!process.env.GEMINI_API_KEY
}
