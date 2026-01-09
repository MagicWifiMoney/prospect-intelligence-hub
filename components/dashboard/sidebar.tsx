
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Star,
  TrendingUp,
  AlertTriangle,
  Target,
  FileText,
  Settings,
  BarChart3,
  Plus,
  Gem,
  Mail,
  Globe,
  Radar
} from 'lucide-react'

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'All Prospects', href: '/dashboard/prospects', icon: Users },
  { name: 'Hot Leads', href: '/dashboard/hot-leads', icon: Star },
  { name: 'Goldmines', href: '/dashboard/goldmines', icon: Gem },
  { name: 'Lead Gen Opps', href: '/dashboard/lead-gen', icon: Globe },
  { name: 'Scraper', href: '/dashboard/scrape', icon: Radar },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Market Trends', href: '/dashboard/trends', icon: TrendingUp },
  { name: 'Anomalies', href: '/dashboard/anomalies', icon: AlertTriangle },
  { name: 'New Businesses', href: '/dashboard/new-businesses', icon: Target },
  { name: 'Email Hub', href: '/dashboard/email', icon: Mail },
  { name: 'Add Prospects', href: '/dashboard/add-prospects', icon: Plus },
  { name: 'Export & Reports', href: '/dashboard/reports', icon: FileText },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-[#0a0f1a]/80 backdrop-blur-xl border-r border-white/10">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center h-16 px-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <Radar className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold font-display text-white">
              Prospect Hub
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-cyan-500/20 to-cyan-500/5 text-cyan-400 border-l-2 border-cyan-400 shadow-lg shadow-cyan-500/10"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 transition-colors",
                    isActive
                      ? "text-cyan-400"
                      : "text-gray-500 group-hover:text-gray-300"
                  )}
                />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-white/10">
          <Link
            href="/dashboard/settings"
            className={cn(
              "group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
              pathname === '/dashboard/settings'
                ? "bg-gradient-to-r from-cyan-500/20 to-cyan-500/5 text-cyan-400 border-l-2 border-cyan-400"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Settings className={cn(
              "mr-3 h-5 w-5 transition-colors",
              pathname === '/dashboard/settings'
                ? "text-cyan-400"
                : "text-gray-500 group-hover:text-gray-300"
            )} />
            Settings
          </Link>
        </div>
      </div>
    </div>
  )
}
