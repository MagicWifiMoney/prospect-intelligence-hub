
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Bell, LogOut, User, Settings, RefreshCw, Eye } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function DashboardHeader() {
  const { data: session } = useSession() || {}
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()

  const isDemoUser = session?.user?.email === 'demo@prospectintel.com'

  const handleRefreshData = async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch('/api/prospects/refresh', {
        method: 'POST',
      })
      
      if (response.ok) {
        toast({
          title: "Data Refresh Started",
          description: "Prospect data is being updated in the background.",
        })
      } else {
        throw new Error('Failed to start refresh')
      }
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Could not start data refresh. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' })
  }

  const userInitials = session?.user?.name
    ?.split(' ')
    ?.map(name => name[0])
    ?.join('')
    ?.toUpperCase() || 'U'

  return (
    <>
      {isDemoUser && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2">
          <div className="flex items-center justify-center space-x-2 text-sm">
            <Eye className="h-4 w-4" />
            <span>
              <strong>Demo Mode:</strong> You're viewing the dashboard as a guest. Data is read-only. 
              <a href="/auth/signup" className="ml-2 underline hover:text-blue-100">
                Create account
              </a>
            </span>
          </div>
        </div>
      )}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold text-foreground">
            Prospect Intelligence Dashboard
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshData}
            disabled={isRefreshing}
            className="space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh Data</span>
          </Button>

          {/* Notifications */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="relative"
            onClick={() => {
              toast({
                title: "Notifications",
                description: "No new notifications at this time.",
              })
            }}
          >
            <Bell className="h-5 w-5" />
            {/* Badge only shows when there are notifications */}
            {false && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                0
              </Badge>
            )}
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-sm font-medium">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {session?.user?.name || 'User'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session?.user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => router.push('/dashboard/settings')}
              >
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push('/dashboard/settings')}
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
    </>
  )
}
