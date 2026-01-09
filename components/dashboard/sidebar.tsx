
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
  Search,
  Plus,
  Gem,
  DollarSign,
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
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-lg">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-center h-16 px-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-2">
            <Search className="w-8 h-8 text-primary" />
            <div className="text-xl font-bold text-foreground">
              Prospect Hub
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 transition-colors",
                    isActive
                      ? "text-primary-foreground"
                      : "text-muted-foreground group-hover:text-accent-foreground"
                  )}
                />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-800">
          <Link
            href="/dashboard/settings"
            className="group flex items-center px-3 py-2 text-sm font-medium text-muted-foreground rounded-lg hover:bg-accent hover:text-accent-foreground transition-all duration-200"
          >
            <Settings className="mr-3 h-5 w-5" />
            Settings
          </Link>
        </div>
      </div>
    </div>
  )
}
