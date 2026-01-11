'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Users,
  UserPlus,
  Building2,
  Crown,
  Shield,
  User,
  Mail,
  Copy,
  Trash2,
  Loader2,
  Check,
  X,
  Clock,
} from 'lucide-react'
import { toast } from 'sonner'

interface Member {
  id: string
  email: string
  name: string | null
  firstName: string | null
  lastName: string | null
  orgRole: string
  image: string | null
}

interface Invite {
  id: string
  email: string
  role: string
  expiresAt: string
  createdAt: string
}

interface Organization {
  id: string
  name: string
  slug: string
  members: Member[]
  invites: Invite[]
  _count: { prospects: number }
}

export default function TeamPage() {
  const { data: session } = useSession()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [userRole, setUserRole] = useState<string>('member')
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isInviting, setIsInviting] = useState(false)

  // Create org form
  const [newOrgName, setNewOrgName] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [showInviteDialog, setShowInviteDialog] = useState(false)

  // Confirm dialogs
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null)
  const [inviteToCancel, setInviteToCancel] = useState<Invite | null>(null)

  useEffect(() => {
    fetchOrganization()
  }, [])

  const fetchOrganization = async () => {
    try {
      const res = await fetch('/api/organizations')
      const data = await res.json()
      setOrganization(data.organization)
      setUserRole(data.userRole)
    } catch (error) {
      console.error('Failed to fetch organization:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const createOrganization = async () => {
    if (!newOrgName.trim()) {
      toast.error('Please enter an organization name')
      return
    }

    setIsCreating(true)
    try {
      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newOrgName }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }

      toast.success('Organization created!')
      setShowCreateDialog(false)
      setNewOrgName('')
      fetchOrganization()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create organization')
    } finally {
      setIsCreating(false)
    }
  }

  const sendInvite = async () => {
    if (!inviteEmail.trim() || !organization) {
      toast.error('Please enter an email address')
      return
    }

    setIsInviting(true)
    try {
      const res = await fetch(`/api/organizations/${organization.id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error)
      }

      toast.success('Invite sent!')
      setShowInviteDialog(false)
      setInviteEmail('')
      setInviteRole('member')
      fetchOrganization()

      // Copy invite link to clipboard
      if (data.invite?.inviteLink) {
        navigator.clipboard.writeText(data.invite.inviteLink)
        toast.info('Invite link copied to clipboard')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send invite')
    } finally {
      setIsInviting(false)
    }
  }

  const updateMemberRole = async (memberId: string, role: string) => {
    if (!organization) return

    try {
      const res = await fetch(`/api/organizations/${organization.id}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, role }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }

      toast.success('Role updated')
      fetchOrganization()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update role')
    }
  }

  const removeMember = async (memberId: string) => {
    if (!organization) return

    try {
      const res = await fetch(
        `/api/organizations/${organization.id}/members?memberId=${memberId}`,
        { method: 'DELETE' }
      )

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error)
      }

      toast.success(data.message)
      setMemberToRemove(null)
      fetchOrganization()
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove member')
    }
  }

  const cancelInvite = async (inviteId: string) => {
    if (!organization) return

    try {
      const res = await fetch(
        `/api/organizations/${organization.id}/invite?inviteId=${inviteId}`,
        { method: 'DELETE' }
      )

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }

      toast.success('Invite cancelled')
      setInviteToCancel(null)
      fetchOrganization()
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel invite')
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-amber-400" />
      case 'admin':
        return <Shield className="w-4 h-4 text-cyan-400" />
      default:
        return <User className="w-4 h-4 text-gray-400" />
    }
  }

  const getRoleBadge = (role: string) => {
    const styles = {
      owner: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
      admin: 'bg-cyan-400/10 text-cyan-400 border-cyan-400/20',
      member: 'bg-gray-400/10 text-gray-400 border-gray-400/20',
    }
    return styles[role as keyof typeof styles] || styles.member
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    )
  }

  // No organization - show create option
  if (!organization) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-amber-400/20 mb-6">
            <Building2 className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Team Management</h1>
          <p className="text-gray-400">
            Create an organization to collaborate with your team on prospects.
          </p>
        </div>

        <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl p-8 text-center">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            No Organization Yet
          </h3>
          <p className="text-gray-400 mb-6">
            You&apos;re working solo. Create an organization to invite team members
            and share prospects.
          </p>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-[#0a0f1a] font-semibold">
                <Building2 className="w-4 h-4 mr-2" />
                Create Organization
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-800">
              <DialogHeader>
                <DialogTitle className="text-white">Create Organization</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Give your team a name. You can invite members after creating.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="orgName" className="text-white">
                    Organization Name
                  </Label>
                  <Input
                    id="orgName"
                    placeholder="e.g., Acme Agency"
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    className="mt-2 bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setShowCreateDialog(false)}
                  className="text-gray-400"
                >
                  Cancel
                </Button>
                <Button
                  onClick={createOrganization}
                  disabled={isCreating}
                  className="bg-cyan-500 hover:bg-cyan-400 text-[#0a0f1a]"
                >
                  {isCreating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Create'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    )
  }

  // Has organization - show team management
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Building2 className="w-7 h-7 text-cyan-400" />
            {organization.name}
          </h1>
          <p className="text-gray-400 mt-1">
            {organization.members.length} members &bull; {organization._count.prospects} prospects
          </p>
        </div>

        {(userRole === 'owner' || userRole === 'admin') && (
          <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-[#0a0f1a] font-semibold">
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-800">
              <DialogHeader>
                <DialogTitle className="text-white">Invite Team Member</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Send an invite to join {organization.name}.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="email" className="text-white">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="mt-2 bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="role" className="text-white">
                    Role
                  </Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger className="mt-2 bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="member">Member - Can view and manage prospects</SelectItem>
                      <SelectItem value="admin">Admin - Can also invite and remove members</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setShowInviteDialog(false)}
                  className="text-gray-400"
                >
                  Cancel
                </Button>
                <Button
                  onClick={sendInvite}
                  disabled={isInviting}
                  className="bg-cyan-500 hover:bg-cyan-400 text-[#0a0f1a]"
                >
                  {isInviting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Invite
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Members List */}
      <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            Team Members
          </h2>
        </div>
        <div className="divide-y divide-gray-800">
          {organization.members.map((member) => (
            <div
              key={member.id}
              className="px-6 py-4 flex items-center justify-between hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400/20 to-amber-400/20 flex items-center justify-center">
                  {member.image ? (
                    <img
                      src={member.image}
                      alt=""
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <span className="text-white font-semibold">
                      {(member.firstName?.[0] || member.email[0]).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-white">
                    {member.firstName && member.lastName
                      ? `${member.firstName} ${member.lastName}`
                      : member.name || member.email.split('@')[0]}
                    {member.email === session?.user?.email && (
                      <span className="text-gray-500 text-sm ml-2">(you)</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-400">{member.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadge(
                    member.orgRole
                  )}`}
                >
                  {getRoleIcon(member.orgRole)}
                  {member.orgRole.charAt(0).toUpperCase() + member.orgRole.slice(1)}
                </span>

                {userRole === 'owner' && member.orgRole !== 'owner' && (
                  <Select
                    value={member.orgRole}
                    onValueChange={(role) => updateMemberRole(member.id, role)}
                  >
                    <SelectTrigger className="w-24 h-8 bg-gray-800 border-gray-700 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                {((userRole === 'owner' && member.orgRole !== 'owner') ||
                  (userRole === 'admin' && member.orgRole === 'member') ||
                  member.email === session?.user?.email) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMemberToRemove(member)}
                    className="text-gray-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Invites */}
      {organization.invites.length > 0 && (
        <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Pending Invites
            </h2>
          </div>
          <div className="divide-y divide-gray-800">
            {organization.invites.map((invite) => (
              <div
                key={invite.id}
                className="px-6 py-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{invite.email}</p>
                    <p className="text-sm text-gray-400">
                      Invited as {invite.role} &bull; Expires{' '}
                      {new Date(invite.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {(userRole === 'owner' || userRole === 'admin') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setInviteToCancel(invite)}
                    className="text-gray-400 hover:text-red-400"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Remove Member Confirmation */}
      <AlertDialog
        open={!!memberToRemove}
        onOpenChange={() => setMemberToRemove(null)}
      >
        <AlertDialogContent className="bg-gray-900 border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {memberToRemove?.email === session?.user?.email
                ? 'Leave Organization?'
                : 'Remove Member?'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              {memberToRemove?.email === session?.user?.email
                ? userRole === 'owner'
                  ? 'As the owner, leaving will delete the organization and remove all members.'
                  : 'You will lose access to shared prospects and team features.'
                : `${memberToRemove?.email} will be removed from ${organization.name}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 text-white border-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => memberToRemove && removeMember(memberToRemove.id)}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {memberToRemove?.email === session?.user?.email ? 'Leave' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Invite Confirmation */}
      <AlertDialog
        open={!!inviteToCancel}
        onOpenChange={() => setInviteToCancel(null)}
      >
        <AlertDialogContent className="bg-gray-900 border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Cancel Invite?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              The invite to {inviteToCancel?.email} will be cancelled and they won&apos;t
              be able to join using the existing link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 text-white border-gray-700">
              Keep Invite
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => inviteToCancel && cancelInvite(inviteToCancel.id)}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Cancel Invite
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
