'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  CalendarDays,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  CreditCard,
  BookOpen,
  AlertCircle,
  Plus,
  ListFilter,
  LayoutGrid,
} from 'lucide-react'
import { useBookings, useCancelBooking } from '@/hooks/use-bookings'
import { cn, formatDateTime, formatCurrency, formatDate } from '@/lib/utils'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import type { BookingWithDetails } from '@/types/database'

function PaymentBadge({ status }: { status: string }) {
  if (status === 'paid') return <Badge variant="success">支払済</Badge>
  return <Badge variant="warning">未払い</Badge>
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'reserved') return <Badge variant="default">予約済</Badge>
  if (status === 'completed') return <Badge variant="success">完了</Badge>
  if (status === 'cancelled') return <Badge variant="danger">キャンセル</Badge>
  return <Badge variant="secondary">{status}</Badge>
}

interface BookingCardProps {
  booking: BookingWithDetails
  onCancel?: (id: string) => void
  cancelPending?: boolean
}

function BookingCard({ booking, onCancel, cancelPending }: BookingCardProps) {
  const activity = booking.activity_schedule.activity
  const schedule = booking.activity_schedule

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Activity Info */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start gap-3 flex-wrap">
              <Link
                href={`/activities/${activity.id}`}
                className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors leading-snug"
              >
                {activity.title}
              </Link>
              <StatusBadge status={booking.status} />
              <PaymentBadge status={booking.payment_status} />
            </div>
            <p className="text-sm text-gray-500">{activity.organization.name}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 shrink-0" />
                {formatDateTime(schedule.date_time)}
              </span>
              {activity.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {activity.location}
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-indigo-600">
              {formatCurrency(activity.price)}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-row sm:flex-col gap-2 shrink-0">
            {booking.status === 'reserved' && onCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCancel(booking.id)}
                isLoading={cancelPending}
                className="text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300"
              >
                <XCircle className="h-4 w-4 mr-1" />
                キャンセル
              </Button>
            )}
            {booking.status === 'completed' && (
              <Link
                href={`/reflections?activityId=${activity.id}`}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 h-8 px-3 text-xs font-medium transition-all"
              >
                <BookOpen className="h-4 w-4 mr-1" />
                振り返り
              </Link>
            )}
            {booking.status === 'completed' && booking.payment_status === 'pending' && (
              <Link
                href={`/payments/${booking.id}`}
                className="inline-flex items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 h-8 px-3 text-xs font-medium transition-all"
              >
                <CreditCard className="h-4 w-4 mr-1" />
                支払う
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── ミニカレンダー（予約日ハイライト）────────────────────────
function MiniCalendar({ bookings }: { bookings: BookingWithDetails[] }) {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthLabel = today.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })

  const bookedDates = new Set(
    bookings
      .filter((b) => b.status === 'reserved')
      .map((b) => {
        const d = new Date(b.activity_schedule.date_time)
        return d.getFullYear() === year && d.getMonth() === month ? d.getDate() : null
      })
      .filter(Boolean)
  )

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm font-semibold text-gray-700 mb-3 text-center">{monthLabel}</p>
        <div className="grid grid-cols-7 gap-1 text-center">
          {['日','月','火','水','木','金','土'].map((d) => (
            <span key={d} className="text-xs text-gray-400 font-medium pb-1">{d}</span>
          ))}
          {cells.map((day, i) => (
            <span
              key={i}
              className={cn(
                'text-xs rounded-full w-7 h-7 flex items-center justify-center mx-auto',
                !day && '',
                day === today.getDate() && 'bg-indigo-600 text-white font-bold',
                day && bookedDates.has(day) && day !== today.getDate() && 'bg-indigo-100 text-indigo-700 font-semibold',
                day && !bookedDates.has(day) && day !== today.getDate() && 'text-gray-700',
              )}
            >
              {day ?? ''}
            </span>
          ))}
        </div>
        <p className="text-xs text-gray-400 text-center mt-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-100 mr-1" />予約あり
        </p>
      </CardContent>
    </Card>
  )
}

function BookingListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function EmptyState({ tab }: { tab: string }) {
  const messages: Record<string, { icon: React.ReactNode; title: string; desc: string }> = {
    upcoming: {
      icon: <CalendarDays className="h-12 w-12 mx-auto mb-3 text-gray-300" />,
      title: '予約中のアクティビティはありません',
      desc: '新しいアクティビティを探して予約しましょう',
    },
    past: {
      icon: <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />,
      title: '完了したアクティビティはありません',
      desc: 'アクティビティに参加すると履歴が表示されます',
    },
    cancelled: {
      icon: <XCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />,
      title: 'キャンセルした予約はありません',
      desc: '',
    },
  }
  const msg = messages[tab]
  return (
    <Card>
      <CardContent className="p-12 text-center text-gray-500">
        {msg.icon}
        <p className="font-medium text-gray-700">{msg.title}</p>
        {msg.desc && <p className="text-sm mt-1">{msg.desc}</p>}
        {tab === 'upcoming' && (
          <Link
            href="/activities"
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 h-10 px-4 py-2 text-sm font-medium transition-all"
          >
            アクティビティを探す
          </Link>
        )}
      </CardContent>
    </Card>
  )
}

export default function BookingsPage() {
  const { data: bookings, isPending } = useBookings()
  const { mutate: cancelBooking, isPending: cancelPending, variables: cancelId } = useCancelBooking()
  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null)

  const now = new Date()

  const upcoming = (bookings ?? []).filter(
    (b) =>
      b.status === 'reserved' &&
      new Date(b.activity_schedule.date_time) > now
  )
  const past = (bookings ?? []).filter(
    (b) =>
      b.status === 'completed' ||
      (b.status === 'reserved' && new Date(b.activity_schedule.date_time) <= now)
  )
  const cancelled = (bookings ?? []).filter((b) => b.status === 'cancelled')

  const handleCancel = (bookingId: string) => {
    if (cancelConfirm === bookingId) {
      cancelBooking(bookingId)
      setCancelConfirm(null)
    } else {
      setCancelConfirm(bookingId)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">予約管理</h1>
          <p className="text-gray-500 mt-1">あなたのアクティビティ予約一覧</p>
        </div>
        <Link
          href="/activities"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 h-10 px-4 text-sm font-medium transition-all shrink-0"
        >
          <Plus className="h-4 w-4" />
          活動を追加
        </Link>
      </div>

      {/* ミニカレンダー */}
      {!isPending && bookings && bookings.length > 0 && (
        <MiniCalendar bookings={bookings} />
      )}

      {/* Cancel confirmation alert */}
      {cancelConfirm && (
        <div className="flex items-start gap-3 rounded-xl bg-orange-50 border border-orange-200 p-4">
          <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-orange-800">
              本当にキャンセルしますか？
            </p>
            <p className="text-xs text-orange-600 mt-0.5">
              この操作は取り消せません
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelConfirm(null)}
            >
              戻る
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => cancelBooking(cancelConfirm, { onSuccess: () => setCancelConfirm(null) })}
              isLoading={cancelPending}
            >
              キャンセルする
            </Button>
          </div>
        </div>
      )}

      <Tabs defaultValue="upcoming">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="upcoming" className="flex-1 sm:flex-none">
            予約中
            {upcoming.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-indigo-600 text-white rounded-full">
                {upcoming.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="past" className="flex-1 sm:flex-none">
            過去
            {past.length > 0 && (
              <span className="ml-2 text-xs text-gray-500">({past.length})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="flex-1 sm:flex-none">
            キャンセル
            {cancelled.length > 0 && (
              <span className="ml-2 text-xs text-gray-500">({cancelled.length})</span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {isPending ? (
            <BookingListSkeleton />
          ) : upcoming.length === 0 ? (
            <EmptyState tab="upcoming" />
          ) : (
            <div className="space-y-4">
              {upcoming.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onCancel={handleCancel}
                  cancelPending={cancelPending && cancelId === booking.id}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past">
          {isPending ? (
            <BookingListSkeleton />
          ) : past.length === 0 ? (
            <EmptyState tab="past" />
          ) : (
            <div className="space-y-4">
              {past.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cancelled">
          {isPending ? (
            <BookingListSkeleton />
          ) : cancelled.length === 0 ? (
            <EmptyState tab="cancelled" />
          ) : (
            <div className="space-y-4">
              {cancelled.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
