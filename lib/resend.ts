import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Default from address - update this after verifying your domain in Resend
const DEFAULT_FROM = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

export interface SendEmailParams {
  to: string
  subject: string
  html: string
  from?: string
  replyTo?: string
}

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Send a single email via Resend
 */
export async function sendEmail({
  to,
  subject,
  html,
  from = DEFAULT_FROM,
  replyTo,
}: SendEmailParams): Promise<SendEmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      replyTo,
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, messageId: data?.id }
  } catch (err) {
    console.error('Failed to send email:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    }
  }
}

/**
 * Send multiple emails via Resend (batch)
 */
export async function sendBatchEmails(
  emails: SendEmailParams[]
): Promise<{ sent: number; failed: number; results: SendEmailResult[] }> {
  const results: SendEmailResult[] = []
  let sent = 0
  let failed = 0

  for (const email of emails) {
    const result = await sendEmail(email)
    results.push(result)
    if (result.success) {
      sent++
    } else {
      failed++
    }
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  return { sent, failed, results }
}

/**
 * Check if Resend is configured
 */
export function isResendConfigured(): boolean {
  return !!process.env.RESEND_API_KEY
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
