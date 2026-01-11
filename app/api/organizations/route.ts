import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET: List user's organization
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organization: {
          include: {
            members: {
              select: {
                id: true,
                email: true,
                name: true,
                firstName: true,
                lastName: true,
                orgRole: true,
                image: true,
              },
            },
            invites: {
              where: {
                expiresAt: { gt: new Date() },
              },
              select: {
                id: true,
                email: true,
                role: true,
                expiresAt: true,
                createdAt: true,
              },
            },
            _count: {
              select: {
                prospects: true,
              },
            },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      organization: user.organization,
      userRole: user.orgRole,
    })
  } catch (error) {
    console.error('Error fetching organization:', error)
    return NextResponse.json(
      { error: 'Failed to fetch organization' },
      { status: 500 }
    )
  }
}

// POST: Create a new organization
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name } = await request.json()

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Organization name must be at least 2 characters' },
        { status: 400 }
      )
    }

    // Check if user already in an organization
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, organizationId: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.organizationId) {
      return NextResponse.json(
        { error: 'You are already in an organization. Leave it first to create a new one.' },
        { status: 400 }
      )
    }

    // Generate unique slug
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    let slug = baseSlug
    let counter = 1
    while (await prisma.organization.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Create organization and add user as owner
    const organization = await prisma.organization.create({
      data: {
        name: name.trim(),
        slug,
        members: {
          connect: { id: user.id },
        },
      },
    })

    // Update user to be owner
    await prisma.user.update({
      where: { id: user.id },
      data: { orgRole: 'owner' },
    })

    // Migrate user's existing prospects to the organization
    await prisma.prospect.updateMany({
      where: { userId: user.id, organizationId: null },
      data: { organizationId: organization.id },
    })

    return NextResponse.json({
      success: true,
      organization,
    })
  } catch (error) {
    console.error('Error creating organization:', error)
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    )
  }
}
