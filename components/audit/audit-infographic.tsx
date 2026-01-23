import React from 'react'

interface AuditInfographicProps {
    companyName: string
    city?: string | null
    businessType?: string | null
    googleRating?: number | null
    reviewCount?: number | null
    yelpRating?: number | null
    yelpReviewCount?: number | null
    angiRating?: number | null
    angiReviewCount?: number | null
    facebookRating?: number | null
    facebookReviewCount?: number | null
    missedRevenue?: string
    healthScore?: number
    generatedDate?: string
}

// Calculate directory health score (0-100)
function calculateHealthScore(props: AuditInfographicProps): number {
    let score = 0

    if (props.googleRating) {
        score += (props.googleRating / 5) * 25
        score += Math.min(15, (props.reviewCount || 0) / 5)
    }

    if (props.yelpRating) {
        score += (props.yelpRating / 5) * 20
    }

    if (props.angiRating) {
        score += (props.angiRating / 5) * 15
    }

    if (props.facebookRating) {
        score += (props.facebookRating / 5) * 15
    }

    // Presence bonus
    if (props.yelpRating) score += 5
    if (props.angiRating) score += 3
    if (props.facebookRating) score += 2

    return Math.min(100, Math.round(score))
}

// Estimate missed revenue
function estimateMissedRevenue(props: AuditInfographicProps): string {
    let missedMonthly = 0

    if (!props.yelpRating) missedMonthly += 750
    if ((props.reviewCount || 0) < 30) missedMonthly += 400
    missedMonthly += 800 // missed calls estimate

    const annual = missedMonthly * 12
    return `$${annual.toLocaleString()}`
}

/**
 * React component designed for html-to-image conversion.
 * Renders a branded infographic card with prospect data.
 */
export function AuditInfographic(props: AuditInfographicProps) {
    const healthScore = props.healthScore || calculateHealthScore(props)
    const missedRevenue = props.missedRevenue || estimateMissedRevenue(props)
    const date = props.generatedDate || new Date().toLocaleDateString()

    const healthColor = healthScore >= 70 ? '#10b981' : healthScore >= 40 ? '#f59e0b' : '#ef4444'
    const healthLabel = healthScore >= 70 ? 'Healthy' : healthScore >= 40 ? 'Needs Work' : 'Critical'

    return (
        <div
            style={{
                width: 600,
                padding: 32,
                background: 'linear-gradient(135deg, #0a0f1a 0%, #1a1f2e 100%)',
                borderRadius: 24,
                fontFamily: 'system-ui, -apple-system, sans-serif',
                color: '#ffffff',
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 24,
                    paddingBottom: 16,
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                }}
            >
                <div>
                    <div style={{ fontSize: 12, color: '#06b6d4', letterSpacing: 2, marginBottom: 4 }}>
                        🔍 DIGITAL PRESENCE AUDIT
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 700 }}>{props.companyName}</div>
                    <div style={{ fontSize: 14, color: '#9ca3af' }}>
                        {props.city && `${props.city}, MN`} {props.businessType && `• ${props.businessType}`}
                    </div>
                </div>
                <div
                    style={{
                        padding: '8px 16px',
                        background: 'rgba(6, 182, 212, 0.2)',
                        borderRadius: 20,
                        fontSize: 12,
                        color: '#06b6d4',
                    }}
                >
                    {date}
                </div>
            </div>

            {/* Scores Row */}
            <div
                style={{
                    display: 'flex',
                    gap: 16,
                    marginBottom: 24,
                }}
            >
                {/* Health Score */}
                <div
                    style={{
                        flex: 1,
                        padding: 20,
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: 16,
                        textAlign: 'center',
                    }}
                >
                    <div style={{ fontSize: 11, color: '#9ca3af', letterSpacing: 1, marginBottom: 8 }}>
                        DIRECTORY HEALTH
                    </div>
                    <div style={{ fontSize: 36, fontWeight: 700, color: healthColor }}>{healthScore}</div>
                    <div style={{ fontSize: 12, color: healthColor }}>{healthLabel}</div>
                </div>

                {/* Missed Revenue */}
                <div
                    style={{
                        flex: 1,
                        padding: 20,
                        background: 'rgba(239, 68, 68, 0.1)',
                        borderRadius: 16,
                        textAlign: 'center',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                    }}
                >
                    <div style={{ fontSize: 11, color: '#9ca3af', letterSpacing: 1, marginBottom: 8 }}>
                        EST. MISSED REVENUE
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: '#ef4444' }}>{missedRevenue}</div>
                    <div style={{ fontSize: 12, color: '#ef4444' }}>per year</div>
                </div>
            </div>

            {/* Directory Grid */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 12,
                    marginBottom: 20,
                }}
            >
                {/* Google */}
                <div
                    style={{
                        padding: 16,
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: 12,
                        textAlign: 'center',
                    }}
                >
                    <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 8 }}>GOOGLE</div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>
                        {props.googleRating ? `${props.googleRating.toFixed(1)}★` : '—'}
                    </div>
                    <div style={{ fontSize: 10, color: '#6b7280' }}>{props.reviewCount || 0} reviews</div>
                </div>

                {/* Yelp */}
                <div
                    style={{
                        padding: 16,
                        background: props.yelpRating ? 'rgba(255,255,255,0.05)' : 'rgba(239,68,68,0.1)',
                        borderRadius: 12,
                        textAlign: 'center',
                        border: props.yelpRating ? 'none' : '1px solid rgba(239,68,68,0.3)',
                    }}
                >
                    <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 8 }}>YELP</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: props.yelpRating ? '#fff' : '#ef4444' }}>
                        {props.yelpRating ? `${props.yelpRating.toFixed(1)}★` : '❌'}
                    </div>
                    <div style={{ fontSize: 10, color: '#6b7280' }}>
                        {props.yelpRating ? `${props.yelpReviewCount || 0} reviews` : 'Missing'}
                    </div>
                </div>

                {/* Angi */}
                <div
                    style={{
                        padding: 16,
                        background: props.angiRating ? 'rgba(255,255,255,0.05)' : 'rgba(239,68,68,0.1)',
                        borderRadius: 12,
                        textAlign: 'center',
                        border: props.angiRating ? 'none' : '1px solid rgba(239,68,68,0.3)',
                    }}
                >
                    <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 8 }}>ANGI</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: props.angiRating ? '#fff' : '#ef4444' }}>
                        {props.angiRating ? `${props.angiRating.toFixed(1)}★` : '❌'}
                    </div>
                    <div style={{ fontSize: 10, color: '#6b7280' }}>
                        {props.angiRating ? `${props.angiReviewCount || 0} reviews` : 'Missing'}
                    </div>
                </div>

                {/* Facebook */}
                <div
                    style={{
                        padding: 16,
                        background: props.facebookRating ? 'rgba(255,255,255,0.05)' : 'rgba(239,68,68,0.1)',
                        borderRadius: 12,
                        textAlign: 'center',
                        border: props.facebookRating ? 'none' : '1px solid rgba(239,68,68,0.3)',
                    }}
                >
                    <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 8 }}>FACEBOOK</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: props.facebookRating ? '#fff' : '#ef4444' }}>
                        {props.facebookRating ? `${props.facebookRating.toFixed(1)}★` : '❌'}
                    </div>
                    <div style={{ fontSize: 10, color: '#6b7280' }}>
                        {props.facebookRating ? `${props.facebookReviewCount || 0} reviews` : 'Missing'}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div
                style={{
                    textAlign: 'center',
                    fontSize: 10,
                    color: '#6b7280',
                    letterSpacing: 1,
                }}
            >
                POWERED BY ALPHA PROSPECT INTELLIGENCE
            </div>
        </div>
    )
}
