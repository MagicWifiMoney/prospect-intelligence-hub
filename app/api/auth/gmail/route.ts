export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getAuthUrl, isGmailConnected, deleteGoogleToken } from '@/lib/gmail'
import { prisma } from '@/lib/db'

/**
 * GET: Start Gmail OAuth flow or check connection status
 * Query: ?action=connect (start OAuth) or ?action=status (check status) or ?action=disconnect
 */
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user ID
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const { searchParams } = new URL(request.url)
        const action = searchParams.get('action') || 'status'

        if (action === 'connect') {
            // Redirect to Google OAuth
            const authUrl = getAuthUrl()
            return NextResponse.redirect(authUrl)
        }

        if (action === 'disconnect') {
            await deleteGoogleToken(user.id)
            return NextResponse.json({ success: true, connected: false })
        }

        // Default: check status
        const connected = await isGmailConnected(user.id)
        return NextResponse.json({ connected })

    } catch (error) {
        console.error('Gmail auth error:', error)
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
    }
}
