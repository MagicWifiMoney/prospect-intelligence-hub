/**
 * GoHighLevel API Integration for Nuclear Demo Environment
 * 
 * Creates sandbox sub-accounts for prospects to experience
 * live automation demos with their business data.
 */

const GHL_API_BASE = 'https://services.leadconnectorhq.com'

interface GHLConfig {
    apiKey: string
    agencyId: string
    demoTemplateId: string // Template location with pre-built automations
}

function getGHLConfig(): GHLConfig | null {
    const apiKey = process.env.GHL_API_KEY
    const agencyId = process.env.GHL_AGENCY_ID
    const demoTemplateId = process.env.GHL_DEMO_TEMPLATE_ID

    if (!apiKey || !agencyId || !demoTemplateId) {
        console.warn('GHL API not fully configured')
        return null
    }

    return { apiKey, agencyId, demoTemplateId }
}

export interface CreateDemoResult {
    success: boolean
    locationId?: string
    error?: string
}

/**
 * Create a demo sub-account for a prospect
 */
export async function createDemoSubAccount(
    companyName: string,
    email?: string,
    phone?: string
): Promise<CreateDemoResult> {
    const config = getGHLConfig()

    if (!config) {
        return { success: false, error: 'GHL API not configured' }
    }

    try {
        // Create location from template
        const response = await fetch(`${GHL_API_BASE}/locations/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json',
                'Version': '2021-07-28'
            },
            body: JSON.stringify({
                companyId: config.agencyId,
                name: `Demo - ${companyName}`,
                templateId: config.demoTemplateId,
                settings: {
                    allowDuplicateContact: true,
                    allowDuplicateOpportunity: true,
                },
                // Mark as sandbox/demo
                tags: ['demo', 'sandbox', 'prospect-preview']
            })
        })

        if (!response.ok) {
            const error = await response.text()
            console.error('GHL create location error:', error)
            return { success: false, error: `GHL API error: ${response.status}` }
        }

        const data = await response.json()
        return {
            success: true,
            locationId: data.location?.id || data.id
        }
    } catch (error) {
        console.error('GHL create demo error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

/**
 * Add prospect as a contact in their demo location
 */
export async function addDemoContact(
    locationId: string,
    contact: {
        firstName: string
        lastName?: string
        phone?: string
        email?: string
        companyName?: string
    }
): Promise<{ success: boolean; contactId?: string; error?: string }> {
    const config = getGHLConfig()

    if (!config) {
        return { success: false, error: 'GHL API not configured' }
    }

    try {
        const response = await fetch(`${GHL_API_BASE}/contacts/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json',
                'Version': '2021-07-28'
            },
            body: JSON.stringify({
                locationId,
                firstName: contact.firstName,
                lastName: contact.lastName || '',
                phone: contact.phone,
                email: contact.email,
                companyName: contact.companyName,
                tags: ['demo_prospect', 'awaiting_demo']
            })
        })

        if (!response.ok) {
            const error = await response.text()
            return { success: false, error: `Failed to add contact: ${response.status}` }
        }

        const data = await response.json()
        return { success: true, contactId: data.contact?.id || data.id }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

/**
 * Trigger the missed call demo automation
 * This simulates a missed call and sends the text-back
 */
export async function triggerMissedCallDemo(
    locationId: string,
    contactId: string
): Promise<{ success: boolean; error?: string }> {
    const config = getGHLConfig()

    if (!config) {
        return { success: false, error: 'GHL API not configured' }
    }

    try {
        // Trigger workflow by adding contact to specific pipeline stage
        // or by using workflow trigger API
        const response = await fetch(`${GHL_API_BASE}/contacts/${contactId}/workflow/demo-missed-call`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json',
                'Version': '2021-07-28'
            },
            body: JSON.stringify({
                locationId,
                // Trigger the "Missed Call Demo" workflow
                workflowId: process.env.GHL_MISSED_CALL_WORKFLOW_ID
            })
        })

        if (!response.ok) {
            // Fallback: Use tag-based trigger
            await fetch(`${GHL_API_BASE}/contacts/${contactId}/tags`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.apiKey}`,
                    'Content-Type': 'application/json',
                    'Version': '2021-07-28'
                },
                body: JSON.stringify({
                    tags: ['trigger_missed_call_demo']
                })
            })
        }

        return { success: true }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

/**
 * Get demo location status and activity
 */
export async function getDemoStatus(
    locationId: string
): Promise<{
    success: boolean
    status?: 'pending' | 'active' | 'engaged' | 'converted'
    messagesExchanged?: number
    lastActivity?: Date
    error?: string
}> {
    const config = getGHLConfig()

    if (!config) {
        return { success: false, error: 'GHL API not configured' }
    }

    try {
        const response = await fetch(`${GHL_API_BASE}/locations/${locationId}/analytics`, {
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Version': '2021-07-28'
            }
        })

        if (!response.ok) {
            return { success: false, error: 'Failed to get demo status' }
        }

        const data = await response.json()

        return {
            success: true,
            status: data.conversations?.active > 0 ? 'engaged' : 'pending',
            messagesExchanged: data.messages?.total || 0,
            lastActivity: data.lastActivityAt ? new Date(data.lastActivityAt) : undefined
        }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

/**
 * Clean up demo locations older than X days
 */
export async function cleanupOldDemos(maxAgeDays: number = 7): Promise<{
    success: boolean
    deletedCount?: number
    error?: string
}> {
    const config = getGHLConfig()

    if (!config) {
        return { success: false, error: 'GHL API not configured' }
    }

    try {
        // Get all demo locations
        const response = await fetch(`${GHL_API_BASE}/locations/?companyId=${config.agencyId}&tags=demo,sandbox`, {
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Version': '2021-07-28'
            }
        })

        if (!response.ok) {
            return { success: false, error: 'Failed to list demo locations' }
        }

        const data = await response.json()
        const locations = data.locations || []
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays)

        let deletedCount = 0

        for (const location of locations) {
            const createdAt = new Date(location.dateAdded)
            if (createdAt < cutoffDate) {
                // Delete old demo location
                await fetch(`${GHL_API_BASE}/locations/${location.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${config.apiKey}`,
                        'Version': '2021-07-28'
                    }
                })
                deletedCount++
            }
        }

        return { success: true, deletedCount }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}
