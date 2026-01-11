
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { SignUpForm } from '@/components/auth/signup-form'
import Link from 'next/link'

export default async function SignUpPage() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="dark min-h-screen flex items-center justify-center bg-[#0a0f1a] relative overflow-hidden">
      {/* Gradient mesh background */}
      <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-cyan-500/5 rounded-full blur-[150px]" />
      <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-amber-500/5 rounded-full blur-[150px]" />
      <div className="noise-overlay" />

      <div className="relative z-10 max-w-md w-full space-y-8 p-8">
        {/* Logo / Brand */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-amber-400 rounded-xl flex items-center justify-center">
              <span className="text-[#0a0f1a] font-bold text-lg">PI</span>
            </div>
            <span className="text-xl font-bold text-white font-display">Prospect Intelligence</span>
          </Link>
          <h2 className="text-3xl font-bold text-white font-display">
            Create Account
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Get access to the Prospect Intelligence Hub
          </p>
        </div>
        <SignUpForm />
      </div>
    </div>
  )
}
