
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  // Check if user has completed onboarding
  const user = await prisma.user.findUnique({
    where: { email: session.user?.email || '' },
    select: { onboardingCompleted: true },
  })

  if (user && !user.onboardingCompleted) {
    redirect('/onboarding')
  }

  return (
    <div className="dark min-h-screen bg-[#0a0f1a] text-white">
      {/* Gradient mesh background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-cyan-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-amber-500/5 rounded-full blur-[150px]" />
        <div className="absolute top-1/3 right-1/4 w-1/3 h-1/3 bg-cyan-500/3 rounded-full blur-[120px]" />
      </div>

      {/* Noise overlay */}
      <div className="noise-overlay" />

      <DashboardSidebar />
      <div className="pl-64 relative">
        <DashboardHeader />
        <main className="p-6 space-y-6">
          {children}
        </main>
      </div>
    </div>
  )
}
