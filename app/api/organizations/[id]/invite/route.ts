import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// POST: Send an invite
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email, role = 'member' } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    if (!['admin', 'member'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Check if user has permission to invite
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, organizationId: true, orgRole: true },
    })

    if (!user || user.organizationId !== params.id) {
      return NextResponse.json({ error: 'Not in this organization' }, { status: 403 })
    }

    if (user.orgRole !== 'owner' && user.orgRole !== 'admin') {
      return NextResponse.json(
        { error: 'Only owners and admins can invite members' },
        { status: 403 }
      )
    }

    // Check if email is already a member
    const existingMember = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        organizationId: params.id,
      },
    })

    if (existingMember) {
      return NextResponse.json(
        { error: 'This person is already a member' },
        { status: 400 }
      )
    }

    // Check for existing pending invite
    const existingInvite = await prisma.invite.findFirst({
      where: {
        email: email.toLowerCase(),
        organizationId: params.id,
        expiresAt: { gt: new Date() },
      },
    })

    if (existingInvite) {
      return NextResponse.json(
        { error: 'An invite is already pending for this email' },
        { status: 400 }
      )
    }

    // Create invite (expires in 7 days)
    const invite = await prisma.invite.create({
      data: {
        email: email.toLowerCase(),
        organizationId: params.id,
        role,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    // TODO: Send invite email with link containing invite.token

    return NextResponse.json({
      success: true,
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expiresAt,
        // Include invite link for manual sharing
        inviteLink: `${process.env.NEXTAUTH_URL}/invite/${invite.token}`,
      },
    })
  } catch (error) {
    console.error('Error creating invite:', error)
    return NextResponse.json(
      { error: 'Failed to create invite' },
      { status: 500 }
    )
  }
}

// DELETE: Cancel an invite
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const inviteId = searchParams.get('inviteId')

    if (!inviteId) {
      return NextResponse.json({ error: 'Invite ID required' }, { status: 400 })
    }

    // Check permission
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { organizationId: true, orgRole: true },
    })

    if (!user || user.organizationId !== params.id) {
      return NextResponse.json({ error: 'Not in this organization' }, { status: 403 })
    }

    if (user.orgRole !== 'owner' && user.orgRole !== 'admin') {
      return NextResponse.json(
        { error: 'Only owners and admins can cancel invites' },
        { status: 403 }
      )
    }

    await prisma.invite.delete({
      where: { id: inviteId, organizationId: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error canceling invite:', error)
    return NextResponse.json(
      { error: 'Failed to cancel invite' },
      { status: 500 }
    )
  }
}
