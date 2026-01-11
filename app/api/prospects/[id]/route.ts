
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prospect = await prisma.prospect.findUnique({
      where: { id: params.id },
      include: {
        ProspectReview: {
          orderBy: { publishedAt: 'desc' },
          take: 20
        },
        ProspectHistorical: {
          orderBy: { recordedAt: 'desc' },
          take: 10
        },
        ProspectActivity: {
          orderBy: { createdAt: 'desc' },
          take: 50
        }
      }
    })

    if (!prospect) {
      return NextResponse.json({ error: 'Prospect not found' }, { status: 404 })
    }

    return NextResponse.json({ prospect })
  } catch (error) {
    console.error('Error fetching prospect:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prospect' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { notes, tags, contactedAt, isConverted } = body

    const updateData: any = {}
    if (notes !== undefined) updateData.notes = notes
    if (tags !== undefined) updateData.tags = tags
    if (contactedAt !== undefined) updateData.contactedAt = contactedAt ? new Date(contactedAt) : null
    if (isConverted !== undefined) updateData.isConverted = isConverted

    const prospect = await prisma.prospect.update({
      where: { id: params.id },
      data: updateData
    })

    // Log activity
    if (notes) {
      await prisma.prospectActivity.create({
        data: {
          prospectId: params.id,
          activityType: 'note',
          content: notes,
          createdBy: session.user?.email || 'system'
        }
      })
    }

    if (tags) {
      await prisma.prospectActivity.create({
        data: {
          prospectId: params.id,
          activityType: 'tag_added',
          content: `Tags updated: ${tags}`,
          createdBy: session.user?.email || 'system'
        }
      })
    }

    if (contactedAt) {
      await prisma.prospectActivity.create({
        data: {
          prospectId: params.id,
          activityType: 'status_change',
          content: 'Marked as contacted',
          createdBy: session.user?.email || 'system'
        }
      })
    }

    return NextResponse.json({ success: true, prospect })
  } catch (error) {
    console.error('Error updating prospect:', error)
    return NextResponse.json(
      { error: 'Failed to update prospect' },
      { status: 500 }
    )
  }
}
