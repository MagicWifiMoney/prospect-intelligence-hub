export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { isResendConfigured } from '@/lib/resend'

/**
 * GET: Check email (Resend) configuration status
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const configured = isResendConfigured()
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

    return NextResponse.json({
      configured,
      provider: 'resend',
      fromEmail: configured ? fromEmail : null,
    })
  } catch (error) {
    console.error('Email status error:', error)
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 })
  }
}
