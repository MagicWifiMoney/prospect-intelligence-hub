import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { createDemoSubAccount, addDemoContact } from '@/lib/gohighlevel'

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession()
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { prospectId } = body

        if (!prospectId) {
            return NextResponse.json({ error: 'Prospect ID required' }, { status: 400 })
        }

        // Fetch prospect
        const prospect = await prisma.prospect.findUnique({
            where: { id: prospectId },
            select: {
                id: true,
                companyName: true,
                ownerName: true,
                ownerEmail: true,
                phone: true,
                demoLocationId: true,
            },
        })

        if (!prospect) {
            return NextResponse.json({ error: 'Prospect not found' }, { status: 404 })
        }

        // Check if demo already exists
        if (prospect.demoLocationId) {
            return NextResponse.json({
                success: true,
                alreadyExists: true,
                demoLocationId: prospect.demoLocationId,
                message: 'Demo already exists for this prospect',
            })
        }

        // Create demo sub-account
        const demoResult = await createDemoSubAccount(
            prospect.companyName,
            prospect.ownerEmail || undefined,
            prospect.phone || undefined
        )

        if (!demoResult.success || !demoResult.locationId) {
            return NextResponse.json(
                { error: demoResult.error || 'Failed to create demo' },
                { status: 500 }
            )
        }

        // Add prospect as contact in their demo
        if (prospect.ownerName) {
            const nameParts = prospect.ownerName.split(' ')
            await addDemoContact(demoResult.locationId, {
                firstName: nameParts[0],
                lastName: nameParts.slice(1).join(' '),
                phone: prospect.phone || undefined,
                email: prospect.ownerEmail || undefined,
                companyName: prospect.companyName,
            })
        }

        // Update prospect with demo info
        await prisma.prospect.update({
            where: { id: prospectId },
            data: {
                demoLocationId: demoResult.locationId,
                demoCreatedAt: new Date(),
                demoStatus: 'pending',
            },
        })

        return NextResponse.json({
            success: true,
            demoLocationId: demoResult.locationId,
            message: `Demo environment created for ${prospect.companyName}`,
        })
    } catch (error) {
        console.error('Error creating demo:', error)
        return NextResponse.json(
            { error: 'Failed to create demo environment' },
            { status: 500 }
        )
    }
}
