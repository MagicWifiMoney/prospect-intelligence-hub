import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// POST: Accept an invite
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Invite token required' }, { status: 400 })
    }

    // Find the invite
    const invite = await prisma.invite.findUnique({
      where: { token },
      include: {
        organization: {
          select: { id: true, name: true },
        },
      },
    })

    if (!invite) {
      return NextResponse.json({ error: 'Invalid invite' }, { status: 404 })
    }

    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invite has expired' }, { status: 400 })
    }

    // Check if invite email matches user
    if (invite.email.toLowerCase() !== session.user.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'This invite was sent to a different email address' },
        { status: 403 }
      )
    }

    // Check if user is already in an organization
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, organizationId: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.organizationId) {
      return NextResponse.json(
        { error: 'You are already in an organization. Leave it first to join another.' },
        { status: 400 }
      )
    }

    // Add user to organization
    await prisma.user.update({
      where: { id: user.id },
      data: {
        organizationId: invite.organizationId,
        orgRole: invite.role,
      },
    })

    // Migrate user's prospects to the organization
    await prisma.prospect.updateMany({
      where: { userId: user.id, organizationId: null },
      data: { organizationId: invite.organizationId },
    })

    // Delete the invite
    await prisma.invite.delete({
      where: { id: invite.id },
    })

    return NextResponse.json({
      success: true,
      organization: invite.organization,
      message: `You have joined ${invite.organization.name}`,
    })
  } catch (error) {
    console.error('Error accepting invite:', error)
    return NextResponse.json(
      { error: 'Failed to accept invite' },
      { status: 500 }
    )
  }
}

// GET: Get invite details (for preview before accepting)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    const invite = await prisma.invite.findUnique({
      where: { token },
      include: {
        organization: {
          select: {
            name: true,
            _count: { select: { members: true } },
          },
        },
      },
    })

    if (!invite) {
      return NextResponse.json({ error: 'Invalid invite' }, { status: 404 })
    }

    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invite has expired' }, { status: 400 })
    }

    return NextResponse.json({
      organizationName: invite.organization.name,
      memberCount: invite.organization._count.members,
      role: invite.role,
      expiresAt: invite.expiresAt,
    })
  } catch (error) {
    console.error('Error fetching invite:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invite' },
      { status: 500 }
    )
  }
}
