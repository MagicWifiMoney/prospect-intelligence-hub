/**
 * Nanobanana API Integration for AI Hero Image Generation
 * 
 * Uses Gemini 2.5 Flash Image model via Nanobanana API
 * https://nanobananaapi.ai
 */

const NANOBANANA_API_URL = 'https://api.nanobanana.app/v1/images/generate'

// Industry-specific prompt templates for hero images
const INDUSTRY_PROMPTS: Record<string, string> = {
    plumber: `Professional plumber in clean uniform standing confidently in front of a modern service van, 
        well-maintained suburban home in background, golden hour lighting, friendly smile, 
        high quality work tools visible, photorealistic, 4K, professional photography`,

    hvac: `HVAC technician with tablet reviewing modern air conditioning unit on commercial rooftop, 
        city skyline background, professional blue uniform, warm sunlight, confident pose, 
        modern equipment, photorealistic, high resolution`,

    electrician: `Licensed electrician working on modern electrical panel, safety equipment visible, 
        professional workshop setting, LED work light illumination, focused expression, 
        organized tools, photorealistic, 4K quality`,

    'heating and cooling': `HVAC professional installing modern furnace in clean basement, 
        professional uniform with company logo area, modern home interior, 
        quality tools organized nearby, photorealistic, warm lighting`,

    dentist: `Modern dental office waiting room, warm welcoming atmosphere, comfortable seating, 
        natural light through windows, minimalist premium interior design, plants, 
        calming colors, photorealistic, high quality interior photography`,

    dental: `Friendly dental hygienist in modern treatment room, state-of-the-art equipment, 
        patient comfort features visible, bright clean environment, 
        professional yet warm atmosphere, photorealistic`,

    restaurant: `Busy upscale restaurant kitchen with chef plating beautiful gourmet dish, 
        warm ambient lighting, stainless steel equipment, steam rising from food, 
        premium dining atmosphere, photorealistic, food photography style`,

    lawyer: `Modern law office conference room with city view, polished wood table, 
        leather chairs, legal books on shelves, natural light, 
        professional sophisticated atmosphere, photorealistic`,

    'real estate': `Real estate agent showing beautiful modern home to happy couple, 
        open concept living room, large windows with natural light, 
        welcoming atmosphere, photorealistic, lifestyle photography`,

    roofer: `Professional roofing crew installing new shingles on residential home, 
        blue sky background, safety equipment visible, quality materials, 
        suburban neighborhood, photorealistic, action shot`,

    landscaping: `Professional landscaper designing beautiful garden, lush green plants, 
        colorful flowers, modern outdoor space, morning golden light, 
        well-maintained lawn, photorealistic, outdoor photography`,

    'auto repair': `Professional auto mechanic in clean shop working on modern vehicle, 
        organized tools, diagnostic equipment, bright lighting, 
        customer-friendly environment, photorealistic`,

    spa: `Luxurious spa treatment room with massage table, candles, 
        aromatherapy setup, bamboo accents, soft ambient lighting, 
        zen peaceful atmosphere, photorealistic, wellness photography`,

    gym: `Modern fitness facility with premium equipment, natural lighting, 
        motivational atmosphere, clean organized space, 
        active lifestyle vibe, photorealistic`,

    default: `Professional small business storefront with welcoming entrance, 
        clean modern design, friendly atmosphere, natural daylight, 
        quality signage area, photorealistic, commercial photography`
}

// Convert business type to prompt key
function getPromptKey(businessType: string | null | undefined): string {
    if (!businessType) return 'default'

    const normalized = businessType.toLowerCase()

    // Check for exact match
    if (INDUSTRY_PROMPTS[normalized]) {
        return normalized
    }

    // Check for partial matches
    for (const key of Object.keys(INDUSTRY_PROMPTS)) {
        if (normalized.includes(key) || key.includes(normalized)) {
            return key
        }
    }

    return 'default'
}

export interface NanobananaOptions {
    width?: number
    height?: number
    quality?: 'standard' | 'hd'
}

export interface NanobananaResponse {
    success: boolean
    imageUrl?: string
    error?: string
}

/**
 * Generate a hero image for a business using Nanobanana API
 */
export async function generateHeroImage(
    businessType: string | null | undefined,
    companyName: string,
    city: string | null | undefined,
    options: NanobananaOptions = {}
): Promise<NanobananaResponse> {
    const apiKey = process.env.NANOBANANA_API_KEY

    if (!apiKey) {
        console.warn('NANOBANANA_API_KEY not configured, skipping hero image generation')
        return { success: false, error: 'API key not configured' }
    }

    try {
        const promptKey = getPromptKey(businessType)
        const basePrompt = INDUSTRY_PROMPTS[promptKey]

        // Enhance prompt with company context
        const enhancedPrompt = `${basePrompt}, 
            representing a business called "${companyName}"${city ? ` in ${city}` : ''}, 
            professional marketing photography style, no text or logos in image`

        const response = await fetch(NANOBANANA_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                prompt: enhancedPrompt,
                model: 'nano-banana-flash', // Gemini 2.5 Flash Image
                width: options.width || 1200,
                height: options.height || 630, // OG image ratio
                quality: options.quality || 'hd'
            })
        })

        if (!response.ok) {
            const error = await response.text()
            console.error('Nanobanana API error:', error)
            return { success: false, error: `API error: ${response.status}` }
        }

        const data = await response.json()

        return {
            success: true,
            imageUrl: data.url || data.image_url || data.data?.[0]?.url
        }
    } catch (error) {
        console.error('Nanobanana generation error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

/**
 * Get the prompt that would be used for a given business type
 * Useful for preview/debugging
 */
export function getPromptForBusinessType(businessType: string | null | undefined): string {
    const key = getPromptKey(businessType)
    return INDUSTRY_PROMPTS[key]
}

/**
 * Get all available industry templates
 */
export function getAvailableIndustries(): string[] {
    return Object.keys(INDUSTRY_PROMPTS).filter(k => k !== 'default')
}
