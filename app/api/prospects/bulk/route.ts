export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getDataScope, buildProspectWhereClause } from '@/lib/data-isolation'

type BulkAction = 'delete' | 'markContacted' | 'markConverted' | 'addTag' | 'removeTag' | 'unmarkContacted' | 'unmarkConverted'

interface BulkActionRequest {
    action: BulkAction
    prospectIds: string[]
    tag?: string // For tag operations
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user's data scope for filtering
        const scope = await getDataScope()
        if (!scope) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body: BulkActionRequest = await request.json()
        const { action, prospectIds, tag } = body

        if (!action || !prospectIds || !Array.isArray(prospectIds) || prospectIds.length === 0) {
            return NextResponse.json(
                { error: 'Invalid request: action and prospectIds are required' },
                { status: 400 }
            )
        }

        // Validate that all prospect IDs belong to the user's scope
        const validProspects = await prisma.prospect.findMany({
            where: {
                id: { in: prospectIds },
                ...buildProspectWhereClause(scope),
            },
            select: { id: true, tags: true },
        })

        const validIds = validProspects.map(p => p.id)

        if (validIds.length === 0) {
            return NextResponse.json(
                { error: 'No valid prospects found' },
                { status: 404 }
            )
        }

        let result: { count: number }

        switch (action) {
            case 'delete':
                result = await prisma.prospect.deleteMany({
                    where: {
                        id: { in: validIds },
                    },
                })
                break

            case 'markContacted':
                result = await prisma.prospect.updateMany({
                    where: {
                        id: { in: validIds },
                    },
                    data: {
                        contactedAt: new Date(),
                    },
                })
                break

            case 'unmarkContacted':
                result = await prisma.prospect.updateMany({
                    where: {
                        id: { in: validIds },
                    },
                    data: {
                        contactedAt: null,
                    },
                })
                break

            case 'markConverted':
                result = await prisma.prospect.updateMany({
                    where: {
                        id: { in: validIds },
                    },
                    data: {
                        isConverted: true,
                        contactedAt: new Date(), // Also mark as contacted
                    },
                })
                break

            case 'unmarkConverted':
                result = await prisma.prospect.updateMany({
                    where: {
                        id: { in: validIds },
                    },
                    data: {
                        isConverted: false,
                    },
                })
                break

            case 'addTag':
                if (!tag) {
                    return NextResponse.json(
                        { error: 'Tag is required for addTag action' },
                        { status: 400 }
                    )
                }
                // For tags, we need to update each prospect individually since we're appending
                const addTagUpdates = validProspects.map(async (prospect) => {
                    const currentTags = prospect.tags ? prospect.tags.split(',').map(t => t.trim()) : []
                    if (!currentTags.includes(tag)) {
                        currentTags.push(tag)
                    }
                    return prisma.prospect.update({
                        where: { id: prospect.id },
                        data: { tags: currentTags.join(', ') },
                    })
                })
                await Promise.all(addTagUpdates)
                result = { count: validProspects.length }
                break

            case 'removeTag':
                if (!tag) {
                    return NextResponse.json(
                        { error: 'Tag is required for removeTag action' },
                        { status: 400 }
                    )
                }
                const removeTagUpdates = validProspects.map(async (prospect) => {
                    const currentTags = prospect.tags ? prospect.tags.split(',').map(t => t.trim()) : []
                    const newTags = currentTags.filter(t => t !== tag)
                    return prisma.prospect.update({
                        where: { id: prospect.id },
                        data: { tags: newTags.join(', ') || null },
                    })
                })
                await Promise.all(removeTagUpdates)
                result = { count: validProspects.length }
                break

            default:
                return NextResponse.json(
                    { error: `Unknown action: ${action}` },
                    { status: 400 }
                )
        }

        return NextResponse.json({
            success: true,
            action,
            affected: result.count,
            requested: prospectIds.length,
            valid: validIds.length,
        })

    } catch (error) {
        console.error('Error performing bulk action:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
