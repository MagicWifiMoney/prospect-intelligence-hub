export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { exchangeCodeForTokens, saveGoogleToken } from '@/lib/gmail'
import { prisma } from '@/lib/db'

/**
 * GET: Handle OAuth callback from Google
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.redirect(new URL('/auth/signin', request.url))
        }

        const { searchParams } = new URL(request.url)
        const code = searchParams.get('code')
        const error = searchParams.get('error')

        if (error) {
            console.error('OAuth error:', error)
            return NextResponse.redirect(
                new URL('/dashboard/email?error=oauth_denied', request.url)
            )
        }

        if (!code) {
            return NextResponse.redirect(
                new URL('/dashboard/email?error=no_code', request.url)
            )
        }

        // Get user ID
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
        })

        if (!user) {
            return NextResponse.redirect(
                new URL('/dashboard/email?error=user_not_found', request.url)
            )
        }

        // Exchange code for tokens
        const tokens = await exchangeCodeForTokens(code)

        if (!tokens.access_token) {
            return NextResponse.redirect(
                new URL('/dashboard/email?error=no_token', request.url)
            )
        }

        // Calculate expiry (tokens.expiry_date is in ms)
        const expiresAt = tokens.expiry_date
            ? new Date(tokens.expiry_date)
            : new Date(Date.now() + 3600 * 1000) // Default 1 hour

        // Save tokens
        await saveGoogleToken(
            user.id,
            tokens.access_token,
            tokens.refresh_token || null,
            expiresAt,
            tokens.scope || ''
        )

        // Redirect back to email hub with success
        return NextResponse.redirect(
            new URL('/dashboard/email?success=connected', request.url)
        )

    } catch (error) {
        console.error('Gmail callback error:', error)
        return NextResponse.redirect(
            new URL('/dashboard/email?error=callback_failed', request.url)
        )
    }
}
