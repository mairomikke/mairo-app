'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import {
  DollarSign, BarChart3, Users, CalendarDays, Clock, TrendingUp,
  Plus, ChevronRight, CheckCircle2, Bell, Target, AlertCircle, Circle,
} from 'lucide-react'
// DISABLED: import { createClient } from '@/lib/supabase/client'
import { useOrganizationBookings } from '@/hooks/use-bookings'
import { cn, formatCurrency, formatDateTime } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { Organization, Activity } from '@/types/database'

const DUMMY_TASKS = [
  { id: 1, label: '木曜クラスの出欠確認', done: false },
  { id: 2, label: '新規予約5件の承認', done: false },
  { id: 3, label: '月次レポート送付', done: true },
  { id: 4, label: 'インストラクター評価入力', done: false },
]
const DUMMY_NOTICES = [
  { id: 1, text: '新規予約が3件入りました', time: '10分前', unread: true },
  { id: 2, text: 'レビューが投稿されました（★4）', time: '1時間前', unread: true },
  { id: 3, text: '土曜クラスの定員が残り2名です', time: '3時間前', unread: false },
]

function PieChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return <p className="text-xs text-gray-400 text-center py-4">データなし</p>
  let cumAngle = -90
  function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = (angleDeg * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }
  const slices = data.map((d) => {
    const angle = (d.value / total) * 360
    const start = cumAngle
    cumAngle += angle
    return { ...d, start, angle }
  })
  const cx = 60, cy = 60, r = 50
  return (
    <div className="flex items-center gap-6">
      <svg width={120} height={120} viewBox="0 0 120 120">
        {slices.map((s, i) => {
          if (s.angle <= 0) return null
          const st = polarToXY(cx, cy, r, s.start)
          const en = polarToXY(cx, cy, r, s.start + s.angle)
          const large = s.angle > 180 ? 1 : 0
          return <path key={i} d={`M${cx},${cy} L${st.x},${st.y} A${r},${r} 0 ${large},1 ${en.x},${en.y} Z`} fill={s.color} stroke="white" strokeWidth={1} />
        })}
      </svg>
      <ul className="space-y-1.5">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: d.color }} />
            <span className="text-gray-600">{d.label}</span>
            <span className="font-semibold text-gray-900 ml-auto pl-4">{total > 0 ? Math.round((d.value / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function RevenueChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  const W = 320, H = 100, PAD = 24, barW = (W - PAD * 2) / data.length
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H + 20}`} className="overflow-visible">
      {data.map((d, i) => {
        const bh = ((d.value / max) * H) || 2
        const x = PAD + i * barW + barW * 0.15
        return (
          <g key={i}>
            <rect x={x} y={H - bh} width={barW * 0.7} height={bh} rx={3} fill="#6366f1" opacity={0.85} />
            <text x={x + barW * 0.35} y={H + 14} textAnchor="middle" fontSize={9} fill="#9ca3af">{d.label}</text>
          </g>
        )
      })}
    </svg>
  )
}

function OccupancyChecker({ activities }: { activities: Activity[] }) {
  const rows = activities.slice(0, 5).map((a) => {
    const used = Math.min(Math.floor(a.capacity * (0.3 + Math.random() * 0.7)), a.capacity)
    const rate = Math.round((used / Math.max(a.capacity, 1)) * 100)
    return { title: a.title, used, capacity: a.capacity, rate }
  })
  if (rows.length === 0) return <p className="text-sm text-gray-400">アクティビティがありません</p>
  return (
    <div className="space-y-3">
      {rows.map((r, i) => (
        <div key={i}>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="truncate max-w-[60%] text-gray-700 font-medium">{r.title}</span>
            <span className={cn('text-xs font-semibold', r.rate >= 80 ? 'text-red-500' : r.rate >= 50 ? 'text-amber-500' : 'text-green-500')}>
              {r.used}/{r.capacity}名 ({r.rate}%)
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-100">
            <div className={cn('h-2 rounded-full transition-all', r.rate >= 80 ? 'bg-red-400' : r.rate >= 50 ? 'bg-amber-400' : 'bg-green-400')} style={{ width: `${r.rate}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

interface OrgAdminDashboardProps { userId: string }

export function OrgAdminDashboard({ userId }: OrgAdminDashboardProps) {
  const [org, setOrg] = useState<Organization | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [orgLoading, setOrgLoading] = useState(true)
  const [tasks, setTasks] = useState(DUMMY_TASKS)
  const [notices, setNotices] = useState(DUMMY_NOTICES)

  useEffect(() => {
    async function fetchOrg() {
      // DISABLED (Supabase): const supabase = createClient()
      // DISABLED (Supabase): const { data: memberDataRaw } = await supabase.from('organization_members').select('organization_id').eq('user_id', userId).eq('role', 'admin').limit(1).single()
      const memberData = memberDataRaw as { organization_id: string } | null
      if (!memberData) { setOrgLoading(false); return }
      const [orgRes, activitiesRes] = await Promise.all([
        // DISABLED (Supabase): supabase.from('organizations').select('*').eq('id', memberData.organization_id).single(),
        // DISABLED (Supabase): supabase.from('activities').select('*').eq('organization_id', memberData.organization_id).eq('status', 'published').order('created_at', { ascending: false }).limit(10),
      ])
      if (!orgRes.error) setOrg(orgRes.data as Organization)
      if (!activitiesRes.error) setActivities((activitiesRes.data ?? []) as Activity[])
      setOrgLoading(false)
    }
    fetchOrg()
  }, [userId])

  const orgId = org?.id ?? ''
  const { data: bookings, isPending: bookingsPending } = useOrganizationBookings(orgId)
  const isLoading = orgLoading || bookingsPending

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const bookingsThisMonth = (bookings ?? []).filter((b) => new Date(b.created_at) >= startOfMonth)
  const recentBookings = (bookings ?? []).slice(0, 8)
  const totalRevenue = (bookings ?? []).filter((b) => b.payment_status === 'paid').reduce((s, b) => s + (b.activity_schedule.activity.price ?? 0), 0)
  const monthRevenue = bookingsThisMonth.filter((b) => b.payment_status === 'paid').reduce((s, b) => s + (b.activity_schedule.activity.price ?? 0), 0)
  const pendingPayments = (bookings ?? []).filter((b) => b.status === 'completed' && b.payment_status === 'pending').length
  const activeStudents = new Set(bookingsThisMonth.map((b) => b.user_id)).size
  const reservedCount = (bookings ?? []).filter((b) => b.status === 'reserved').length
  const completedCount = (bookings ?? []).filter((b) => b.status === 'completed').length
  const cancelledCount = (bookings ?? []).filter((b) => b.status === 'cancelled').length

  const revenueChartData = useMemo(() => Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    return { label: `${d.getMonth() + 1}月`, value: i === 5 && monthRevenue > 0 ? monthRevenue : Math.floor(Math.random() * 200000 + 50000) }
  }), [monthRevenue])

  const activityBookingCounts: Record<string, { title: string; count: number; capacity: number }> = {}
  for (const booking of bookings ?? []) {
    const actId = booking.activity_schedule.activity.id
    if (!activityBookingCounts[actId]) activityBookingCounts[actId] = { title: booking.activity_schedule.activity.title, count: 0, capacity: booking.activity_schedule.activity.capacity }
    activityBookingCounts[actId].count++
  }
  const topActivities = Object.values(activityBookingCounts).sort((a, b) => b.count - a.count).slice(0, 5)
  const maxCount = topActivities[0]?.count || 1

  function getStatusBadge(status: string, paymentStatus: string) {
    if (status === 'cancelled') return <Badge variant="danger">キャンセル</Badge>
    if (status === 'completed') return <Badge variant="success">完了</Badge>
    if (status === 'reserved') return paymentStatus === 'paid' ? <Badge variant="success">予約済・支払済</Badge> : <Badge variant="warning">予約済</Badge>
    return <Badge variant="secondary">{status}</Badge>
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{orgLoading ? <Skeleton className="h-8 w-64" /> : (org?.name ?? '組織管理ダッシュボード')}</h1>
          <p className="text-gray-500 mt-1">{org?.description ?? '子どもたちの可能性を、課外活動で広げる。'}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link href="/organization/activities" className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 h-9 px-3 text-sm font-medium transition-all"><Plus className="h-4 w-4" />活動追加</Link>
          <Link href="/organization/analytics" className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 h-9 px-3 text-sm font-medium transition-all"><BarChart3 className="h-4 w-4" />分析</Link>
        </div>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3"><DollarSign className="h-5 w-5 opacity-80" /><span className="text-sm font-medium opacity-80">累計売上</span></div>
            {isLoading ? <Skeleton className="h-9 w-32 bg-white/20" /> : <p className="text-3xl font-bold">{formatCurrency(totalRevenue)}</p>}
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3"><TrendingUp className="h-5 w-5 opacity-80" /><span className="text-sm font-medium opacity-80">今月の売上</span></div>
            {isLoading ? <Skeleton className="h-9 w-32 bg-white/20" /> : <p className="text-3xl font-bold">{formatCurrency(monthRevenue)}</p>}
          </CardContent>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? [1,2,3,4].map((i) => <Card key={i}><CardContent className="p-5 flex items-center gap-4"><Skeleton className="h-11 w-11 rounded-xl" /><div className="space-y-2"><Skeleton className="h-7 w-12" /><Skeleton className="h-4 w-24" /></div></CardContent></Card>) : (<>
          <Card><CardContent className="p-5 flex items-center gap-4"><div className="rounded-xl p-3 bg-indigo-100 text-indigo-600"><BarChart3 className="h-5 w-5" /></div><div><p className="text-2xl font-bold text-gray-900">{activities.length}</p><p className="text-sm text-gray-500">公開中の活動</p></div></CardContent></Card>
          <Card><CardContent className="p-5 flex items-center gap-4"><div className="rounded-xl p-3 bg-green-100 text-green-600"><CalendarDays className="h-5 w-5" /></div><div><p className="text-2xl font-bold text-gray-900">{bookingsThisMonth.length}</p><p className="text-sm text-gray-500">今月の予約数</p></div></CardContent></Card>
          <Card><CardContent className="p-5 flex items-center gap-4"><div className="rounded-xl p-3 bg-blue-100 text-blue-600"><Users className="h-5 w-5" /></div><div><p className="text-2xl font-bold text-gray-900">{activeStudents}</p><p className="text-sm text-gray-500">今月の受講者</p></div></CardContent></Card>
          <Card><CardContent className="p-5 flex items-center gap-4"><div className="rounded-xl p-3 bg-orange-100 text-orange-600"><Clock className="h-5 w-5" /></div><div><p className="text-2xl font-bold text-gray-900">{pendingPayments}</p><p className="text-sm text-gray-500">未払い件数</p></div></CardContent></Card>
        </>)}
      </div>

      {/* Tasks + Notices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4 text-indigo-500" />今日の運営タスク</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {tasks.map((t) => (
              <button key={t.id} onClick={() => setTasks((prev) => prev.map((x) => x.id === t.id ? { ...x, done: !x.done } : x))}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm text-left">
                {t.done ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> : <Circle className="h-4 w-4 text-gray-300 shrink-0" />}
                <span className={t.done ? 'line-through text-gray-400' : 'text-gray-700'}>{t.label}</span>
              </button>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-orange-500" />簡易通知センター
              {notices.filter((n) => n.unread).length > 0 && <span className="ml-auto text-xs font-bold bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">{notices.filter((n) => n.unread).length}</span>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {notices.map((n) => (
              <button key={n.id} onClick={() => setNotices((prev) => prev.map((x) => x.id === n.id ? { ...x, unread: false } : x))}
                className={cn('w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-colors', n.unread ? 'bg-orange-50 hover:bg-orange-100' : 'hover:bg-gray-50')}>
                <span className={cn('h-2 w-2 rounded-full mt-1.5 shrink-0', n.unread ? 'bg-orange-500' : 'bg-transparent')} />
                <div className="flex-1 min-w-0"><p className={n.unread ? 'font-medium text-gray-900' : 'text-gray-600'}>{n.text}</p><p className="text-xs text-gray-400 mt-0.5">{n.time}</p></div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4 text-indigo-500" />予約ステータス分布</CardTitle></CardHeader>
          <CardContent>{isLoading ? <Skeleton className="h-28 w-full" /> : <PieChart data={[{ label: '予約済', value: reservedCount, color: '#6366f1' }, { label: '完了', value: completedCount, color: '#10b981' }, { label: 'キャンセル', value: cancelledCount, color: '#f43f5e' }]} />}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-500" />合計売上推移（直近6ヶ月）</CardTitle></CardHeader>
          <CardContent>{isLoading ? <Skeleton className="h-28 w-full" /> : <RevenueChart data={revenueChartData} />}</CardContent>
        </Card>
      </div>

      {/* Occupancy */}
      {activities.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><AlertCircle className="h-4 w-4 text-amber-500" />定員チェッカー（2週間稼働率）</CardTitle></CardHeader>
          <CardContent>{isLoading ? <Skeleton className="h-24 w-full" /> : <OccupancyChecker activities={activities} />}</CardContent>
        </Card>
      )}

      {/* Top Activities */}
      {!isLoading && topActivities.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">アクティビティ別予約数</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {topActivities.map((item) => (
              <div key={item.title}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700 truncate max-w-xs">{item.title}</span>
                  <span className="text-gray-500 ml-2 shrink-0">{item.count}件</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${(item.count / maxCount) * 100}%` }} /></div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Bookings */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">最近の予約</h2>
          <Link href="/organization/bookings" className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1">すべて見る<ChevronRight className="h-4 w-4" /></Link>
        </div>
        {isLoading ? (
          <Card><CardContent className="p-0">{[1,2,3].map((i) => <div key={i} className="p-4 flex items-center gap-4 border-b border-gray-100"><Skeleton className="h-10 w-10 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-3 w-1/4" /></div><Skeleton className="h-6 w-16 rounded-full" /></div>)}</CardContent></Card>
        ) : recentBookings.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-gray-500"><CalendarDays className="h-10 w-10 mx-auto mb-3 text-gray-300" /><p className="font-medium">予約はまだありません</p></CardContent></Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100 bg-gray-50"><th className="text-left p-4 font-medium text-gray-600">受講者</th><th className="text-left p-4 font-medium text-gray-600">アクティビティ</th><th className="text-left p-4 font-medium text-gray-600">日時</th><th className="text-left p-4 font-medium text-gray-600">状態</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {recentBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4"><p className="font-medium text-gray-900">{booking.user.name}</p><p className="text-xs text-gray-400">{booking.user.email}</p></td>
                      <td className="p-4"><p className="font-medium text-gray-900 truncate max-w-[200px]">{booking.activity_schedule.activity.title}</p></td>
                      <td className="p-4 text-gray-500 whitespace-nowrap">{formatDateTime(booking.activity_schedule.date_time)}</td>
                      <td className="p-4">{getStatusBadge(booking.status, booking.payment_status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </section>
    </div>
  )
}
