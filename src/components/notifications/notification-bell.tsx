'use client'

import { useEffect, useRef, useState } from 'react'
import { useUnreadCount, useMarkAsRead, useRealtimeNotifications } from '@/hooks/use-notifications'
import { useNotificationStore } from '@/stores/notification-store'
import { formatRelativeTime } from '@/lib/utils'
import { Bell, BellOff, Calendar, Star, CreditCard, MessageCircle, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import type { NotificationType } from '@/types/database'

const TYPE_CONFIG: Record<
  NotificationType,
  { icon: React.ReactNode; href: string }
> = {
  booking_confirmation: {
    icon: <Calendar className="h-4 w-4 text-blue-600" />,
    href: '/bookings',
  },
  reminder: {
    icon: <Bell className="h-4 w-4 text-orange-500" />,
    href: '/activities',
  },
  feedback_received: {
    icon: <Star className="h-4 w-4 text-yellow-500" />,
    href: '/reflections',
  },
  payment_update: {
    icon: <CreditCard className="h-4 w-4 text-green-600" />,
    href: '/bookings',
  },
  message: {
    icon: <MessageCircle className="h-4 w-4 text-indigo-600" />,
    href: '/messages',
  },
}

export function NotificationBell() {
  const { data: count } = useUnreadCount()
  const markAsRead = useMarkAsRead()
  const { notifications, unreadCount } = useNotificationStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useRealtimeNotifications()

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick)
    }
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) {
      document.addEventListener('keydown', handleKey)
    }
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  const displayCount = unreadCount ?? count ?? 0
  const recent = notifications.slice(0, 5)

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
        aria-label={`通知 (${displayCount}件未読)`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell className="h-5 w-5" />
        {displayCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-600 text-white text-[10px] font-bold leading-none">
            {displayCount > 99 ? '99+' : displayCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">通知</h3>
            {displayCount > 0 && (
              <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                {displayCount}件未読
              </span>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-[360px] overflow-y-auto">
            {recent.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <BellOff className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-xs">通知はありません</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recent.map((n) => {
                  const config = TYPE_CONFIG[n.type] ?? {
                    icon: <Bell className="h-4 w-4 text-gray-400" />,
                    href: '/',
                  }

                  return (
                    <Link
                      key={n.id}
                      href={config.href}
                      onClick={() => {
                        if (!n.is_read) markAsRead.mutate(n.id)
                        setOpen(false)
                      }}
                      className="block hover:bg-gray-50 transition-colors"
                    >
                      <div
                        className={`flex items-start gap-3 px-4 py-3 ${
                          !n.is_read ? 'bg-indigo-50/50' : ''
                        }`}
                      >
                        <div
                          className={`mt-0.5 p-1.5 rounded-full shrink-0 ${
                            !n.is_read ? 'bg-white shadow-sm' : 'bg-gray-100'
                          }`}
                        >
                          {config.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-xs leading-relaxed ${
                              !n.is_read ? 'text-gray-900 font-medium' : 'text-gray-600'
                            }`}
                          >
                            {n.content}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-1">
                            {formatRelativeTime(n.created_at)}
                          </p>
                        </div>
                        {!n.is_read && (
                          <span className="h-2 w-2 rounded-full bg-indigo-600 shrink-0 mt-1.5" />
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-4 py-2.5">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              すべての通知を見る
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
