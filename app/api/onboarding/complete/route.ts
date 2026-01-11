import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface OnboardingData {
  businessUrl: string
  businessName: string
  detectedIndustry: string
  targetIndustries: string[]
  targetCities: string[]
  userGoal: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data: OnboardingData = await request.json()

    // Validate required fields
    if (!data.businessName || !data.userGoal) {
      return NextResponse.json(
        { error: 'Business name and goal are required' },
        { status: 400 }
      )
    }

    // Build dashboard config based on user's selections
    const dashboardConfig = {
      defaultIndustries: data.targetIndustries,
      defaultCities: data.targetCities,
      showHotLeads: true,
      showGoldmines: data.userGoal === 'find_leads',
      showLeadGen: data.userGoal === 'grow_agency',
      showCompetitors: data.userGoal === 'monitor_competitors',
      defaultView: 'prospects',
      createdAt: new Date().toISOString(),
    }

    // Update user with onboarding data
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        onboardingCompleted: true,
        businessUrl: data.businessUrl || null,
        businessName: data.businessName,
        detectedIndustry: data.detectedIndustry || null,
        targetIndustries: data.targetIndustries || [],
        targetCities: data.targetCities || [],
        userGoal: data.userGoal,
        dashboardConfig: dashboardConfig,
      },
      select: {
        id: true,
        email: true,
        businessName: true,
        onboardingCompleted: true,
      },
    })

    return NextResponse.json({
      success: true,
      user: updatedUser,
      redirectTo: '/dashboard',
    })
  } catch (error) {
    console.error('Onboarding completion error:', error)
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    )
  }
}

// GET endpoint to check onboarding status
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        onboardingCompleted: true,
        businessName: true,
        targetIndustries: true,
        targetCities: true,
        userGoal: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      onboardingCompleted: user.onboardingCompleted,
      businessName: user.businessName,
      targetIndustries: user.targetIndustries,
      targetCities: user.targetCities,
      userGoal: user.userGoal,
    })
  } catch (error) {
    console.error('Onboarding status error:', error)
    return NextResponse.json(
      { error: 'Failed to get onboarding status' },
      { status: 500 }
    )
  }
}
