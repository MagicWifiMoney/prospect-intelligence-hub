import { google } from 'googleapis'
import { prisma } from './db'

// Gmail OAuth Configuration
const GMAIL_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GMAIL_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const GMAIL_REDIRECT_URI = process.env.NEXTAUTH_URL
    ? `${process.env.NEXTAUTH_URL}/api/auth/gmail/callback`
    : 'http://localhost:3000/api/auth/gmail/callback'

// Scopes needed for sending emails
const GMAIL_SCOPES = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly',
]

/**
 * Create OAuth2 client for Gmail
 */
export function createOAuth2Client() {
    return new google.auth.OAuth2(
        GMAIL_CLIENT_ID,
        GMAIL_CLIENT_SECRET,
        GMAIL_REDIRECT_URI
    )
}

/**
 * Get the authorization URL for Gmail OAuth
 */
export function getAuthUrl(): string {
    const oauth2Client = createOAuth2Client()
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: GMAIL_SCOPES,
        prompt: 'consent', // Force to get refresh token
    })
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string) {
    const oauth2Client = createOAuth2Client()
    const { tokens } = await oauth2Client.getToken(code)
    return tokens
}

/**
 * Get stored Google token for a user
 */
export async function getStoredToken(userId: string) {
    return prisma.googleToken.findUnique({
        where: { userId },
    })
}

/**
 * Save or update Google token for a user
 */
export async function saveGoogleToken(
    userId: string,
    accessToken: string,
    refreshToken: string | null,
    expiresAt: Date,
    scope: string
) {
    return prisma.googleToken.upsert({
        where: { userId },
        update: {
            accessToken,
            refreshToken: refreshToken || undefined,
            expiresAt,
            scope,
            updatedAt: new Date(),
        },
        create: {
            userId,
            accessToken,
            refreshToken,
            expiresAt,
            scope,
        },
    })
}

/**
 * Delete Google token (disconnect Gmail)
 */
export async function deleteGoogleToken(userId: string) {
    return prisma.googleToken.delete({
        where: { userId },
    }).catch(() => null) // Ignore if doesn't exist
}

/**
 * Get authenticated Gmail client for a user
 */
export async function getGmailClient(userId: string) {
    const token = await getStoredToken(userId)
    if (!token) {
        throw new Error('Gmail not connected. Please connect your Gmail account first.')
    }

    const oauth2Client = createOAuth2Client()
    oauth2Client.setCredentials({
        access_token: token.accessToken,
        refresh_token: token.refreshToken,
        expiry_date: token.expiresAt.getTime(),
    })

    // Check if token needs refresh
    if (token.expiresAt < new Date()) {
        try {
            const { credentials } = await oauth2Client.refreshAccessToken()

            // Save the new tokens
            if (credentials.access_token) {
                await saveGoogleToken(
                    userId,
                    credentials.access_token,
                    credentials.refresh_token || token.refreshToken,
                    new Date(credentials.expiry_date || Date.now() + 3600000),
                    token.scope || ''
                )
                oauth2Client.setCredentials(credentials)
            }
        } catch (error) {
            console.error('Failed to refresh token:', error)
            throw new Error('Gmail token expired. Please reconnect your Gmail account.')
        }
    }

    return google.gmail({ version: 'v1', auth: oauth2Client })
}

/**
 * Send an email via Gmail
 */
export async function sendEmail(
    userId: string,
    to: string,
    subject: string,
    body: string,
    fromName?: string
): Promise<{ messageId: string; threadId: string }> {
    const gmail = await getGmailClient(userId)

    // Get user's email from profile
    const profile = await gmail.users.getProfile({ userId: 'me' })
    const fromEmail = profile.data.emailAddress

    // Build the email
    const emailLines = [
        `From: ${fromName ? `${fromName} <${fromEmail}>` : fromEmail}`,
        `To: ${to}`,
        `Subject: ${subject}`,
        'Content-Type: text/html; charset=utf-8',
        '',
        body,
    ]

    const email = emailLines.join('\r\n')
    const encodedEmail = Buffer.from(email)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')

    const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
            raw: encodedEmail,
        },
    })

    return {
        messageId: response.data.id || '',
        threadId: response.data.threadId || '',
    }
}

/**
 * Check if a user has Gmail connected
 */
export async function isGmailConnected(userId: string): Promise<boolean> {
    const token = await getStoredToken(userId)
    return !!token
}

/**
 * Replace template variables with prospect data
 */
export function replaceTemplateVariables(
    template: string,
    prospect: {
        companyName?: string | null
        ownerName?: string | null
        googleRating?: number | null
        reviewCount?: number | null
        businessType?: string | null
        city?: string | null
        website?: string | null
        phone?: string | null
        email?: string | null
    }
): string {
    const replacements: Record<string, string> = {
        '{{companyName}}': prospect.companyName || 'your company',
        '{{ownerName}}': prospect.ownerName || 'there',
        '{{googleRating}}': prospect.googleRating?.toString() || 'great',
        '{{reviewCount}}': prospect.reviewCount?.toString() || 'many',
        '{{businessType}}': prospect.businessType || 'your services',
        '{{city}}': prospect.city || 'your area',
        '{{website}}': prospect.website || '',
        '{{phone}}': prospect.phone || '',
        '{{email}}': prospect.email || '',
    }

    let result = template
    for (const [key, value] of Object.entries(replacements)) {
        result = result.replace(new RegExp(key, 'g'), value)
    }
    return result
}
