import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { addDemoContact, triggerMissedCallDemo } from '@/lib/gohighlevel'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { prospectId, phone, firstName } = body

        if (!prospectId || !phone) {
            return NextResponse.json(
                { error: 'Prospect ID and phone required' },
                { status: 400 }
            )
        }

        // Fetch prospect
        const prospect = await prisma.prospect.findUnique({
            where: { id: prospectId },
            select: {
                id: true,
                companyName: true,
                demoLocationId: true,
                demoStatus: true,
            },
        })

        if (!prospect) {
            return NextResponse.json({ error: 'Prospect not found' }, { status: 404 })
        }

        if (!prospect.demoLocationId) {
            return NextResponse.json(
                { error: 'Demo not yet created for this prospect' },
                { status: 400 }
            )
        }

        // Add the visitor as a contact in the demo
        const contactResult = await addDemoContact(prospect.demoLocationId, {
            firstName: firstName || 'Demo',
            phone,
            companyName: prospect.companyName,
        })

        if (!contactResult.success || !contactResult.contactId) {
            return NextResponse.json(
                { error: contactResult.error || 'Failed to add contact' },
                { status: 500 }
            )
        }

        // Trigger the missed call demo automation
        const triggerResult = await triggerMissedCallDemo(
            prospect.demoLocationId,
            contactResult.contactId
        )

        if (!triggerResult.success) {
            return NextResponse.json(
                { error: triggerResult.error || 'Failed to trigger demo' },
                { status: 500 }
            )
        }

        // Update demo status
        await prisma.prospect.update({
            where: { id: prospectId },
            data: {
                demoTriggeredAt: new Date(),
                demoPhone: phone,
                demoStatus: 'active',
            },
        })

        return NextResponse.json({
            success: true,
            message: 'Demo triggered! Check your phone in a few seconds.',
        })
    } catch (error) {
        console.error('Error triggering demo:', error)
        return NextResponse.json(
            { error: 'Failed to trigger demo' },
            { status: 500 }
        )
    }
}
