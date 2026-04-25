'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useRealtimeNotifications,
} from '@/hooks/use-notifications'
import { useNotificationStore } from '@/stores/notification-store'
import { formatRelativeTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Calendar,
  Star,
  CreditCard,
  MessageCircle,
  Bell,
  BellOff,
  CheckCheck,
  ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import type { Notification, NotificationType } from '@/types/database'

// ── Icon map ──────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  NotificationType,
  { icon: React.ReactNode; label: string; href: string }
> = {
  booking_confirmation: {
    icon: <Calendar className="h-5 w-5 text-blue-600" />,
    label: '予約確認',
    href: '/bookings',
  },
  reminder: {
    icon: <Bell className="h-5 w-5 text-orange-500" />,
    label: 'リマインダー',
    href: '/activities',
  },
  feedback_received: {
    icon: <Star className="h-5 w-5 text-yellow-500" />,
    label: 'フィードバック',
    href: '/reflections',
  },
  payment_update: {
    icon: <CreditCard className="h-5 w-5 text-green-600" />,
    label: '支払い',
    href: '/bookings',
  },
  message: {
    icon: <MessageCircle className="h-5 w-5 text-indigo-600" />,
    label: 'メッセージ',
    href: '/messages',
  },
}

// ── Single notification item ──────────────────────────────────────────────────

function NotificationItem({ notification }: { notification: Notification }) {
  const markAsRead = useMarkAsRead()
  const config = TYPE_CONFIG[notification.type] ?? {
    icon: <Bell className="h-5 w-5 text-gray-500" />,
    label: 'お知らせ',
    href: '/',
  }

  function handleClick() {
    if (!notification.is_read) {
      markAsRead.mutate(notification.id)
    }
  }

  return (
    <Link href={config.href} onClick={handleClick} className="block group">
      <div
        className={`flex items-start gap-4 px-5 py-4 transition-colors group-hover:bg-gray-50 ${
          !notification.is_read ? 'border-l-4 border-l-indigo-600 bg-indigo-50/40' : 'border-l-4 border-l-transparent'
        }`}
      >
        {/* Icon */}
        <div
          className={`mt-0.5 shrink-0 p-2 rounded-full ${
            !notification.is_read ? 'bg-white shadow-sm' : 'bg-gray-100'
          }`}
        >
          {config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span
                className={`text-xs font-semibold uppercase tracking-wide ${
                  !notification.is_read ? 'text-indigo-600' : 'text-gray-500'
                }`}
              >
                {config.label}
              </span>
              <p
                className={`text-sm mt-0.5 leading-relaxed ${
                  !notification.is_read ? 'text-gray-900 font-medium' : 'text-gray-700'
                }`}
              >
                {notification.content}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!notification.is_read && (
                <span className="h-2 w-2 rounded-full bg-indigo-600 shrink-0 mt-1" />
              )}
              <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {formatRelativeTime(notification.created_at)}
          </p>
        </div>
      </div>
    </Link>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [page, setPage] = useState(1)
  const { data: result, isPending } = useNotifications({ page, pageSize: 20 })
  const markAllAsRead = useMarkAllAsRead()
  const { notifications, unreadCount } = useNotificationStore()

  useRealtimeNotifications()

  const totalPages = result?.totalPages ?? 1
  const total = result?.count ?? 0

  // Infinite-scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null)

  const loadMore = useCallback(() => {
    if (page < totalPages && !isPending) {
      setPage((p) => p + 1)
    }
  }, [page, totalPages, isPending])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore()
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore])

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">通知</h1>
          {total > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {total}件の通知
              {unreadCount > 0 && (
                <span className="ml-2 text-indigo-600 font-medium">({unreadCount}件未読)</span>
              )}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsRead.mutate()}
            isLoading={markAllAsRead.isPending}
          >
            <CheckCheck className="h-4 w-4 mr-1.5" />
            すべて既読にする
          </Button>
        )}
      </div>

      {/* Notification list */}
      <Card>
        <CardContent className="p-0">
          {isPending && page === 1 ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin h-6 w-6 rounded-full border-2 border-indigo-600 border-t-transparent" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <BellOff className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">通知はありません</p>
              <p className="text-xs mt-1 text-gray-400">新しい通知が届くとここに表示されます</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-100">
                {notifications.map((n) => (
                  <NotificationItem key={n.id} notification={n} />
                ))}
              </div>

              {/* Infinite scroll sentinel */}
              {page < totalPages && (
                <div ref={sentinelRef} className="flex items-center justify-center py-4">
                  {isPending ? (
                    <div className="animate-spin h-5 w-5 rounded-full border-2 border-indigo-600 border-t-transparent" />
                  ) : (
                    <Button variant="ghost" size="sm" onClick={loadMore}>
                      もっと読み込む
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
