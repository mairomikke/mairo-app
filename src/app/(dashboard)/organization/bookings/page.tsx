'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { formatDateTime, formatCurrency, cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Download, ChevronLeft, ChevronRight, CheckCircle2, CreditCard,
  Filter, AlertCircle, CalendarDays, Users, QrCode, CheckCheck,
  XCircle, Clock, UserCheck, RefreshCw,
} from 'lucide-react'
import type { Activity, BookingStatus, PaymentStatus } from '@/types/database'

interface BookingRow {
  id: string
  status: BookingStatus
  payment_status: PaymentStatus
  created_at: string
  profiles: { id: string; name: string; email: string } | null
  activity_schedules: {
    id: string
    date_time: string
    activities: { id: string; title: string; price: number } | null
  } | null
}

const PAGE_SIZE = 20
const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = { reserved: '予約済み', completed: '完了', cancelled: 'キャンセル' }
const BOOKING_STATUS_COLORS: Record<BookingStatus, string> = { reserved: 'bg-blue-100 text-blue-700', completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' }
const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = { pending: '未払い', paid: '支払済み' }
const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = { pending: 'bg-yellow-100 text-yellow-700', paid: 'bg-green-100 text-green-700' }

// ── Mini Calendar ─────────────────────────────────────────────────────────────
function BookingCalendar({ bookings }: { bookings: BookingRow[] }) {
  const [viewDate, setViewDate] = useState(new Date())
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthLabel = viewDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })

  const dayMap = useMemo(() => {
    const m: Record<number, number> = {}
    bookings.forEach((b) => {
      if (!b.activity_schedules) return
      const d = new Date(b.activity_schedules.date_time)
      if (d.getFullYear() === year && d.getMonth() === month) {
        m[d.getDate()] = (m[d.getDate()] ?? 0) + 1
      }
    })
    return m
  }, [bookings, year, month])

  const today = new Date()
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><CalendarDays className="h-4 w-4 text-indigo-500" />月間カレンダー</CardTitle>
          <div className="flex items-center gap-1">
            <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-1 rounded hover:bg-gray-100"><ChevronLeft className="h-4 w-4" /></button>
            <span className="text-sm font-medium px-2">{monthLabel}</span>
            <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-1 rounded hover:bg-gray-100"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-center">
          {['日','月','火','水','木','金','土'].map((d) => (
            <span key={d} className="text-xs text-gray-400 font-medium pb-1">{d}</span>
          ))}
          {cells.map((day, i) => {
            const count = day ? (dayMap[day] ?? 0) : 0
            const isToday = day === today.getDate() && year === today.getFullYear() && month === today.getMonth()
            return (
              <div key={i} className={cn('relative flex flex-col items-center justify-center h-9 rounded-lg text-xs', isToday ? 'bg-indigo-600 text-white font-bold' : day ? 'hover:bg-gray-50' : '')}>
                {day && <span>{day}</span>}
                {count > 0 && !isToday && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-indigo-400" />}
                {count > 0 && isToday && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-white" />}
              </div>
            )
          })}
        </div>
        <p className="text-xs text-gray-400 text-center mt-2"><span className="inline-block w-2 h-2 rounded-full bg-indigo-400 mr-1" />予約あり</p>
      </CardContent>
    </Card>
  )
}

// ── Approval Panel ────────────────────────────────────────────────────────────
function ApprovalPanel({ bookings, onRefresh }: { bookings: BookingRow[]; onRefresh: () => void }) {
  const pending = bookings.filter((b) => b.status === 'reserved' && b.payment_status === 'pending')
  const [processing, setProcessing] = useState<string | null>(null)

  async function approve(id: string) {
    setProcessing(id)
    setProcessing(null); onRefresh()
  }
  async function reject(id: string) {
    setProcessing(id)
    setProcessing(null); onRefresh()
  }

  if (pending.length === 0) return (
    <Card><CardContent className="p-6 text-center text-gray-400 text-sm"><CheckCheck className="h-8 w-8 mx-auto mb-2 text-green-400" />承認待ちの予約はありません</CardContent></Card>
  )

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-amber-500" />承認待ち
          <span className="ml-auto text-xs font-bold bg-amber-500 text-white rounded-full px-2 py-0.5">{pending.length}件</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {pending.slice(0, 8).map((b) => (
          <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{b.profiles?.name}</p>
              <p className="text-xs text-gray-500 truncate">{b.activity_schedules?.activities?.title}</p>
              <p className="text-xs text-gray-400">{b.activity_schedules && formatDateTime(b.activity_schedules.date_time)}</p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button onClick={() => approve(b.id)} disabled={processing === b.id}
                className="flex items-center gap-1 text-xs bg-green-600 text-white rounded-lg px-2.5 py-1.5 hover:bg-green-700 disabled:opacity-50 transition-colors">
                <CheckCircle2 className="h-3.5 w-3.5" />承認
              </button>
              <button onClick={() => reject(b.id)} disabled={processing === b.id}
                className="flex items-center gap-1 text-xs bg-red-100 text-red-600 rounded-lg px-2.5 py-1.5 hover:bg-red-200 disabled:opacity-50 transition-colors">
                <XCircle className="h-3.5 w-3.5" />却下
              </button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// ── Attendance Panel ─────────────────────────────────────────────────────────
function AttendancePanel({ bookings }: { bookings: BookingRow[] }) {
  const [scanned, setScanned] = useState<Set<string>>(new Set())
  const today = new Date()
  const todayBookings = bookings.filter((b) => {
    if (!b.activity_schedules) return false
    const d = new Date(b.activity_schedules.date_time)
    return d.toDateString() === today.toDateString()
  })

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2"><QrCode className="h-4 w-4 text-purple-500" />出欠確認（QR / UI）</CardTitle>
      </CardHeader>
      <CardContent>
        {todayBookings.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">本日の予約はありません</p>
        ) : (
          <div className="space-y-2">
            {todayBookings.map((b) => {
              const attended = scanned.has(b.id)
              return (
                <div key={b.id} className={cn('flex items-center gap-3 p-3 rounded-xl border', attended ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100')}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{b.profiles?.name}</p>
                    <p className="text-xs text-gray-400">{b.activity_schedules?.activities?.title}</p>
                  </div>
                  <button onClick={() => setScanned((prev) => { const s = new Set(prev); attended ? s.delete(b.id) : s.add(b.id); return s })}
                    className={cn('text-xs rounded-lg px-3 py-1.5 font-medium transition-colors', attended ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100')}>
                    {attended ? '出席済 ✓' : '出席登録'}
                  </button>
                </div>
              )
            })}
            <p className="text-xs text-gray-400 text-center pt-1">{scanned.size} / {todayBookings.length} 名出席</p>
          </div>
        )}
        <div className="mt-4 flex justify-center">
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center w-40">
            <QrCode className="h-10 w-10 mx-auto text-gray-300 mb-2" />
            <p className="text-xs text-gray-400">QRスキャン<br />（モック）</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function OrgBookingsPage() {
  const { user } = useAuthStore()
  const [orgId, setOrgId] = useState<string | null>(null)
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [activities, setActivities] = useState<Activity[]>([])

  // Filters
  const [filterActivity, setFilterActivity] = useState('all')
  const [filterStatus, setFilterStatus] = useState<BookingStatus | 'all'>('all')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')

  // Bootstrap
  useEffect(() => {
    if (!user) return
  }, [user])

  async function loadActivities(oid: string) {}

  useEffect(() => {
    if (!orgId) return
    loadBookings()
  }, [orgId, page, filterActivity, filterStatus, filterDateFrom, filterDateTo])

  async function loadBookings() {
    if (!orgId) return
    setLoading(true)
    setLoading(false)
  }

  async function handleMarkComplete(bookingId: string) {
    await loadBookings()
  }

  async function handleRequestPayment(bookingId: string) {
    await loadBookings()
  }

  function exportCSV() {
    const headers = ['予約ID', '生徒名', 'メール', 'アクティビティ', '日時', '予約状況', '支払状況', '価格']
    const rows = bookings.map((b) => [
      b.id,
      b.profiles?.name ?? '',
      b.profiles?.email ?? '',
      b.activity_schedules?.activities?.title ?? '',
      b.activity_schedules ? formatDateTime(b.activity_schedules.date_time) : '',
      BOOKING_STATUS_LABELS[b.status],
      PAYMENT_STATUS_LABELS[b.payment_status],
      b.activity_schedules?.activities?.price
        ? formatCurrency(b.activity_schedules.activities.price)
        : '',
    ])

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bookings_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">予約管理</h1>
          <p className="text-sm text-gray-500 mt-1">全予約の確認・管理・エクスポート</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => loadBookings()}><RefreshCw className="h-4 w-4 mr-1.5" />更新</Button>
          <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-1.5" />CSVエクスポート</Button>
        </div>
      </div>

      {/* ── カレンダー・承認・出欠 ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <BookingCalendar bookings={bookings} />
        <ApprovalPanel bookings={bookings} onRefresh={loadBookings} />
        <AttendancePanel bookings={bookings} />
      </div>

      {/* ── 予約一覧（既存フィルタ・テーブル） ─────────────── */}
      <h2 className="text-lg font-semibold text-gray-900">予約一覧</h2>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-end gap-3">
            <Filter className="h-4 w-4 text-gray-400 shrink-0 mb-2" />

            <div className="min-w-[180px]">
              <label className="block text-xs font-medium text-gray-600 mb-1">アクティビティ</label>
              <Select value={filterActivity} onValueChange={(v) => { setFilterActivity(v); setPage(1) }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  {activities.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[140px]">
              <label className="block text-xs font-medium text-gray-600 mb-1">予約状況</label>
              <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v as BookingStatus | 'all'); setPage(1) }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="reserved">予約済み</SelectItem>
                  <SelectItem value="completed">完了</SelectItem>
                  <SelectItem value="cancelled">キャンセル</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">日程（From）</label>
              <Input
                type="date"
                value={filterDateFrom}
                onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1) }}
                className="w-36"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">日程（To）</label>
              <Input
                type="date"
                value={filterDateTo}
                onChange={(e) => { setFilterDateTo(e.target.value); setPage(1) }}
                className="w-36"
              />
            </div>

            {(filterActivity !== 'all' || filterStatus !== 'all' || filterDateFrom || filterDateTo) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterActivity('all')
                  setFilterStatus('all')
                  setFilterDateFrom('')
                  setFilterDateTo('')
                  setPage(1)
                }}
              >
                リセット
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin h-6 w-6 rounded-full border-2 border-indigo-600 border-t-transparent" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <AlertCircle className="h-10 w-10 mb-2 opacity-40" />
              <p className="text-sm">予約が見つかりません</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left px-5 py-3 font-semibold text-gray-600">生徒</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">アクティビティ</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">日時</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-600">予約状況</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-600">支払状況</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">金額</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {bookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {booking.profiles?.name ?? '不明'}
                            </p>
                            <p className="text-xs text-gray-500">{booking.profiles?.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-gray-900 truncate max-w-[180px]">
                            {booking.activity_schedules?.activities?.title ?? '—'}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-gray-600 whitespace-nowrap">
                          {booking.activity_schedules
                            ? formatDateTime(booking.activity_schedules.date_time)
                            : '—'}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${BOOKING_STATUS_COLORS[booking.status]}`}
                          >
                            {BOOKING_STATUS_LABELS[booking.status]}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PAYMENT_STATUS_COLORS[booking.payment_status]}`}
                          >
                            {PAYMENT_STATUS_LABELS[booking.payment_status]}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right font-medium text-gray-900">
                          {booking.activity_schedules?.activities?.price != null
                            ? formatCurrency(booking.activity_schedules.activities.price)
                            : '—'}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-1">
                            {booking.status === 'reserved' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkComplete(booking.id)}
                                className="text-green-700 border-green-300 hover:bg-green-50"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                完了
                              </Button>
                            )}
                            {booking.payment_status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRequestPayment(booking.id)}
                                className="text-indigo-700 border-indigo-300 hover:bg-indigo-50"
                              >
                                <CreditCard className="h-3.5 w-3.5 mr-1" />
                                支払済
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    {total}件中 {(page - 1) * PAGE_SIZE + 1}〜
                    {Math.min(page * PAGE_SIZE, total)}件を表示
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-gray-600 px-2">
                      {page} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
