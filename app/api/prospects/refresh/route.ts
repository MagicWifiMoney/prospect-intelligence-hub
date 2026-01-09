
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create a background job for data refresh
    const job = await prisma.systemJob.create({
      data: {
        jobType: 'prospect_refresh',
        status: 'pending',
        payload: JSON.stringify({ 
          initiatedBy: session.user?.email,
          timestamp: new Date().toISOString()
        }),
        scheduledAt: new Date(),
      },
    })

    // In a real implementation, this would trigger a background worker
    // For now, we'll simulate by updating a few prospects
    const prospectsToUpdate = await prisma.prospect.findMany({
      where: {
        gbpUrl: { not: null },
        lastAnalyzed: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // More than 24 hours old
        }
      },
      take: 5,
    })

    // Simulate refresh by updating lastAnalyzed timestamp
    for (const prospect of prospectsToUpdate) {
      await prisma.prospect.update({
        where: { id: prospect.id },
        data: {
          lastAnalyzed: new Date(),
        },
      })
    }

    // Update job status
    await prisma.systemJob.update({
      where: { id: job.id },
      data: {
        status: 'completed',
        result: `Refreshed ${prospectsToUpdate.length} prospects`,
        completedAt: new Date(),
      },
    })

    return NextResponse.json({ 
      success: true,
      jobId: job.id,
      message: `Started refresh for ${prospectsToUpdate.length} prospects`
    })

  } catch (error) {
    console.error('Error refreshing prospects:', error)
    return NextResponse.json(
      { error: 'Failed to start refresh' },
      { status: 500 }
    )
  }
}
