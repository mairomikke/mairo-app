'use client'

import Link from 'next/link'
import { Menu, Bell } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useUnreadCount } from '@/hooks/use-notifications'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuthStore()
  const { data: unreadCount = 0 } = useUnreadCount()

  return (
    <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 h-14 shadow-sm">
      {/* Hamburger */}
      <button
        onClick={onMenuClick}
        className="p-2 -ml-1 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2 flex-1">
        <div className="h-7 w-7 rounded-md bg-indigo-600 flex items-center justify-center">
          <span className="text-white font-bold text-xs">M</span>
        </div>
        <span className="text-lg font-bold text-indigo-600 tracking-tight">Mairo</span>
      </Link>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* Notification bell */}
        <Link
          href="/notifications"
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span
              className={cn(
                'absolute top-1 right-1 flex items-center justify-center',
                'h-4 min-w-4 px-1 rounded-full bg-indigo-600 text-white text-xs font-semibold leading-none'
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>

        {/* User avatar */}
        <Link
          href="/profile"
          className="ml-1 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          aria-label="View profile"
        >
          <Avatar src={user?.avatar_url} name={user?.name} size="sm" />
        </Link>
      </div>
    </header>
  )
}
