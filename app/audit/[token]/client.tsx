'use client'

import { useState } from 'react'
import { AuditPasswordGate } from '@/components/audit/audit-password-gate'
import { AuditContent } from '@/components/audit/audit-content'

interface AuditPageClientProps {
    prospect: {
        id: string
        companyName: string
        city: string | null
        businessType: string | null
        googleRating: number | null
        reviewCount: number | null
        yelpRating: number | null
        yelpReviewCount: number | null
        angiRating: number | null
        angiReviewCount: number | null
        facebookRating: number | null
        facebookReviewCount: number | null
        website: string | null
        loomVideoUrl: string | null
        auditInfographicUrl: string | null
        auditGeneratedAt: Date | null
        auditPassword: string | null
    }
}

export function AuditPageClient({ prospect }: AuditPageClientProps) {
    const [unlocked, setUnlocked] = useState(false)

    if (!unlocked) {
        return (
            <AuditPasswordGate
                companyName={prospect.companyName}
                onUnlock={() => setUnlocked(true)}
            />
        )
    }

    return <AuditContent prospect={prospect} />
}
