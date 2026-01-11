import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET: List organization members
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is in this organization
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { organizationId: true },
    })

    if (!user || user.organizationId !== params.id) {
      return NextResponse.json({ error: 'Not in this organization' }, { status: 403 })
    }

    const members = await prisma.user.findMany({
      where: { organizationId: params.id },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        orgRole: true,
        image: true,
        createdAt: true,
      },
      orderBy: [
        { orgRole: 'asc' }, // owner first, then admin, then member
        { createdAt: 'asc' },
      ],
    })

    return NextResponse.json({ members })
  } catch (error) {
    console.error('Error fetching members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    )
  }
}

// PATCH: Update member role
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { memberId, role } = await request.json()

    if (!memberId || !['admin', 'member'].includes(role)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Check if current user is owner
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, organizationId: true, orgRole: true },
    })

    if (!currentUser || currentUser.organizationId !== params.id) {
      return NextResponse.json({ error: 'Not in this organization' }, { status: 403 })
    }

    if (currentUser.orgRole !== 'owner') {
      return NextResponse.json(
        { error: 'Only the owner can change member roles' },
        { status: 403 }
      )
    }

    // Can't change own role
    if (memberId === currentUser.id) {
      return NextResponse.json(
        { error: 'Cannot change your own role' },
        { status: 400 }
      )
    }

    // Update member role
    const updatedMember = await prisma.user.update({
      where: { id: memberId, organizationId: params.id },
      data: { orgRole: role },
      select: {
        id: true,
        email: true,
        name: true,
        orgRole: true,
      },
    })

    return NextResponse.json({ success: true, member: updatedMember })
  } catch (error) {
    console.error('Error updating member:', error)
    return NextResponse.json(
      { error: 'Failed to update member' },
      { status: 500 }
    )
  }
}

// DELETE: Remove member from organization
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
    const memberId = searchParams.get('memberId')

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID required' }, { status: 400 })
    }

    // Check permissions
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, organizationId: true, orgRole: true },
    })

    if (!currentUser || currentUser.organizationId !== params.id) {
      return NextResponse.json({ error: 'Not in this organization' }, { status: 403 })
    }

    // Get the member to remove
    const memberToRemove = await prisma.user.findUnique({
      where: { id: memberId },
      select: { id: true, organizationId: true, orgRole: true },
    })

    if (!memberToRemove || memberToRemove.organizationId !== params.id) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Owner can remove anyone except themselves
    // Admin can only remove members (not other admins or owner)
    // Members can only remove themselves
    const isSelf = memberId === currentUser.id
    const canRemove =
      (currentUser.orgRole === 'owner' && !isSelf) ||
      (currentUser.orgRole === 'admin' && memberToRemove.orgRole === 'member') ||
      isSelf

    if (!canRemove) {
      return NextResponse.json(
        { error: 'You do not have permission to remove this member' },
        { status: 403 }
      )
    }

    // Can't remove the owner
    if (memberToRemove.orgRole === 'owner' && !isSelf) {
      return NextResponse.json(
        { error: 'Cannot remove the organization owner' },
        { status: 400 }
      )
    }

    // Remove member from organization
    await prisma.user.update({
      where: { id: memberId },
      data: {
        organizationId: null,
        orgRole: 'member',
      },
    })

    // If owner is leaving, delete the organization
    if (memberToRemove.orgRole === 'owner' && isSelf) {
      // First, remove all other members
      await prisma.user.updateMany({
        where: { organizationId: params.id },
        data: { organizationId: null, orgRole: 'member' },
      })

      // Update prospects to belong to no one (or could assign to owner's personal account)
      await prisma.prospect.updateMany({
        where: { organizationId: params.id },
        data: { organizationId: null },
      })

      // Delete all invites
      await prisma.invite.deleteMany({
        where: { organizationId: params.id },
      })

      // Delete the organization
      await prisma.organization.delete({
        where: { id: params.id },
      })

      return NextResponse.json({
        success: true,
        message: 'Organization deleted',
      })
    }

    return NextResponse.json({
      success: true,
      message: isSelf ? 'You have left the organization' : 'Member removed',
    })
  } catch (error) {
    console.error('Error removing member:', error)
    return NextResponse.json(
      { error: 'Failed to remove member' },
      { status: 500 }
    )
  }
}
