import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export interface DataScope {
  userId: string
  organizationId: string | null
  canManageTeam: boolean
  isOwner: boolean
}

/**
 * Get the current user's data scope for filtering prospects
 * Returns userId and organizationId to use in Prisma queries
 */
export async function getDataScope(): Promise<DataScope | null> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      organizationId: true,
      orgRole: true,
    },
  })

  if (!user) {
    return null
  }

  return {
    userId: user.id,
    organizationId: user.organizationId,
    canManageTeam: user.orgRole === 'owner' || user.orgRole === 'admin',
    isOwner: user.orgRole === 'owner',
  }
}

/**
 * Build Prisma where clause for data isolation
 * If user is in an organization, filter by organizationId
 * Otherwise filter by userId
 */
export function buildProspectWhereClause(scope: DataScope) {
  if (scope.organizationId) {
    return { organizationId: scope.organizationId }
  }
  return { userId: scope.userId }
}

/**
 * Get data to assign when creating a new prospect
 */
export function getProspectAssignment(scope: DataScope) {
  if (scope.organizationId) {
    return {
      userId: scope.userId,
      organizationId: scope.organizationId,
    }
  }
  return {
    userId: scope.userId,
    organizationId: null,
  }
}

/**
 * Check if user can access a specific prospect
 */
export async function canAccessProspect(
  prospectId: string,
  scope: DataScope
): Promise<boolean> {
  const prospect = await prisma.prospect.findUnique({
    where: { id: prospectId },
    select: {
      userId: true,
      organizationId: true,
    },
  })

  if (!prospect) {
    return false
  }

  // If user is in an org, check org match
  if (scope.organizationId) {
    return prospect.organizationId === scope.organizationId
  }

  // Otherwise check user match
  return prospect.userId === scope.userId
}
