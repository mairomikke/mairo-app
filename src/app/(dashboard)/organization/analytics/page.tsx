'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
// DISABLED: import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TrendingUp, Users, CreditCard, BarChart2, RefreshCw } from 'lucide-react'
import { format, subDays, parseISO, isSameDay } from 'date-fns'
import { ja } from 'date-fns/locale'

type DateRange = '7d' | '30d' | '90d' | 'custom'

interface DailyRevenue {
  date: string
  revenue: number
  bookings: number
}

interface ActivityBookingCount {
  activityId: string
  title: string
  count: number
}

interface PaymentBreakdown {
  paid: number
  pending: number
}

interface AnalyticsData {
  totalRevenue: number
  totalBookings: number
  uniqueStudents: number
  retentionRate: number
  dailyRevenue: DailyRevenue[]
  topActivities: ActivityBookingCount[]
  paymentBreakdown: PaymentBreakdown
}

const RANGE_OPTIONS: { label: string; value: DateRange }[] = [
  { label: '7日間', value: '7d' },
  { label: '30日間', value: '30d' },
  { label: '90日間', value: '90d' },
  { label: 'カスタム', value: 'custom' },
]

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
          </div>
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function OrgAnalyticsPage() {
  const { user } = useAuthStore()
  const [orgId, setOrgId] = useState<string | null>(null)
  const [range, setRange] = useState<DateRange>('30d')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnalyticsData | null>(null)

  useEffect(() => {
    if (!user) return
    // DISABLED (Supabase): const supabase = createClient()
    // DISABLED (Supabase): supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .single()
      .then(({ data: m }) => {
        if (m) { setOrgId((m as unknown as { organization_id: string }).organization_id) }
      })
  }, [user])

  useEffect(() => {
    if (!orgId) return
    if (range === 'custom' && (!customFrom || !customTo)) return
    loadAnalytics()
  }, [orgId, range, customFrom, customTo])

  function getDateRange(): { from: Date; to: Date } {
    const to = new Date()
    if (range === '7d') return { from: subDays(to, 7), to }
    if (range === '30d') return { from: subDays(to, 30), to }
    if (range === '90d') return { from: subDays(to, 90), to }
    return {
      from: customFrom ? new Date(customFrom) : subDays(to, 30),
      to: customTo ? new Date(customTo + 'T23:59:59') : to,
    }
  }

  async function loadAnalytics() {
    if (!orgId) return
    setLoading(true)
    // DISABLED (Supabase): const supabase = createClient()
    const { from, to } = getDateRange()

    // Fetch all relevant bookings
    // DISABLED (Supabase): const { data: bookings } = await supabase
      .from('bookings')
      .select(`
        id, status, payment_status, created_at, user_id,
        activity_schedules!inner(
          date_time, activity_id,
          activities!inner(id, title, price, organization_id)
        )
      `)
      .eq('activity_schedules.activities.organization_id', orgId)
      .neq('status', 'cancelled')
      .gte('created_at', from.toISOString())
      .lte('created_at', to.toISOString())

    if (!bookings) { setLoading(false); return }

    const typedBookings = bookings as unknown as Array<{
      id: string
      status: string
      payment_status: string
      created_at: string
      user_id: string
      activity_schedules: {
        date_time: string
        activity_id: string
        activities: { id: string; title: string; price: number; organization_id: string }
      }
    }>

    // Total revenue (paid bookings only)
    const totalRevenue = typedBookings
      .filter((b) => b.payment_status === 'paid')
      .reduce((sum, b) => sum + (b.activity_schedules?.activities?.price ?? 0), 0)

    const totalBookings = typedBookings.length
    const uniqueStudentIds = new Set(typedBookings.map((b) => b.user_id))
    const uniqueStudents = uniqueStudentIds.size

    // Retention: students with more than 1 booking
    const studentBookingCount: Record<string, number> = {}
    for (const b of typedBookings) {
      studentBookingCount[b.user_id] = (studentBookingCount[b.user_id] ?? 0) + 1
    }
    const repeatStudents = Object.values(studentBookingCount).filter((c) => c > 1).length
    const retentionRate = uniqueStudents > 0 ? Math.round((repeatStudents / uniqueStudents) * 100) : 0

    // Daily revenue
    const dayCount = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
    const dailyMap: Record<string, DailyRevenue> = {}
    for (let i = 0; i <= Math.min(dayCount, 89); i++) {
      const d = subDays(to, Math.min(dayCount, 89) - i)
      const key = format(d, 'yyyy-MM-dd')
      dailyMap[key] = { date: key, revenue: 0, bookings: 0 }
    }
    for (const b of typedBookings) {
      const key = format(parseISO(b.created_at), 'yyyy-MM-dd')
      if (dailyMap[key]) {
        dailyMap[key].bookings += 1
        if (b.payment_status === 'paid') {
          dailyMap[key].revenue += b.activity_schedules?.activities?.price ?? 0
        }
      }
    }
    const dailyRevenue = Object.values(dailyMap)

    // Top activities
    const activityMap: Record<string, { title: string; count: number }> = {}
    for (const b of typedBookings) {
      const act = b.activity_schedules?.activities
      if (!act) continue
      if (!activityMap[act.id]) activityMap[act.id] = { title: act.title, count: 0 }
      activityMap[act.id].count += 1
    }
    const topActivities = Object.entries(activityMap)
      .map(([id, v]) => ({ activityId: id, title: v.title, count: v.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Payment breakdown
    const paid = typedBookings.filter((b) => b.payment_status === 'paid').length
    const pending = typedBookings.filter((b) => b.payment_status === 'pending').length

    setData({
      totalRevenue,
      totalBookings,
      uniqueStudents,
      retentionRate,
      dailyRevenue,
      topActivities,
      paymentBreakdown: { paid, pending },
    })
    setLoading(false)
  }

  const maxRevenue = data ? Math.max(...data.dailyRevenue.map((d) => d.revenue), 1) : 1
  const maxBookings = data ? Math.max(...data.topActivities.map((a) => a.count), 1) : 1
  const totalPayments = data ? data.paymentBreakdown.paid + data.paymentBreakdown.pending : 0

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">アナリティクス</h1>
          <p className="text-sm text-gray-500 mt-1">売上・予約・生徒データを分析</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadAnalytics} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          更新
        </Button>
      </div>

      {/* Date range selector */}
      <div className="flex flex-wrap items-center gap-2">
        {RANGE_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            size="sm"
            variant={range === opt.value ? 'default' : 'outline'}
            onClick={() => setRange(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
        {range === 'custom' && (
          <div className="flex items-center gap-2 ml-2">
            <Input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="w-36 h-8 text-sm"
            />
            <span className="text-gray-500 text-sm">〜</span>
            <Input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="w-36 h-8 text-sm"
            />
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin h-6 w-6 rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : data ? (
        <>
          {/* Stat cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={<CreditCard className="h-5 w-5" />}
              label="総売上"
              value={formatCurrency(data.totalRevenue)}
              sub="支払済みのみ"
            />
            <StatCard
              icon={<BarChart2 className="h-5 w-5" />}
              label="総予約数"
              value={`${data.totalBookings}件`}
            />
            <StatCard
              icon={<Users className="h-5 w-5" />}
              label="ユニーク生徒数"
              value={`${data.uniqueStudents}名`}
            />
            <StatCard
              icon={<TrendingUp className="h-5 w-5" />}
              label="リピート率"
              value={`${data.retentionRate}%`}
              sub="複数回予約した生徒の割合"
            />
          </div>

          {/* Revenue bar chart */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">日別売上</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-px h-40 overflow-x-auto pb-4">
                {data.dailyRevenue.map((day) => {
                  const height = day.revenue > 0 ? Math.max(4, (day.revenue / maxRevenue) * 100) : 2
                  return (
                    <div
                      key={day.date}
                      className="group relative flex-1 min-w-[6px] flex flex-col items-center justify-end"
                    >
                      <div
                        style={{ height: `${height}%` }}
                        className={`w-full rounded-t transition-all ${
                          day.revenue > 0 ? 'bg-indigo-500 group-hover:bg-indigo-600' : 'bg-gray-100'
                        }`}
                      />
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                        <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                          <p>{format(parseISO(day.date), 'M/d', { locale: ja })}</p>
                          <p>{formatCurrency(day.revenue)}</p>
                          <p>{day.bookings}件</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                {data.dailyRevenue.length > 0 && (
                  <>
                    <span>{format(parseISO(data.dailyRevenue[0].date), 'M/d', { locale: ja })}</span>
                    <span>
                      {format(
                        parseISO(data.dailyRevenue[data.dailyRevenue.length - 1].date),
                        'M/d',
                        { locale: ja }
                      )}
                    </span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Top activities */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">人気アクティビティ（予約数）</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.topActivities.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">データなし</p>
                ) : (
                  data.topActivities.map((act, idx) => (
                    <div key={act.activityId}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-bold text-gray-500 w-5 shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {act.title}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 shrink-0 ml-2">
                          {act.count}件
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all"
                          style={{ width: `${(act.count / maxBookings) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Payment status pie */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">支払い状況</CardTitle>
              </CardHeader>
              <CardContent>
                {totalPayments === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">データなし</p>
                ) : (
                  <>
                    {/* CSS pie chart using conic-gradient */}
                    <div className="flex items-center justify-center mb-6">
                      <div
                        className="h-32 w-32 rounded-full"
                        style={{
                          background: `conic-gradient(
                            #6366f1 0% ${(data.paymentBreakdown.paid / totalPayments) * 100}%,
                            #fbbf24 ${(data.paymentBreakdown.paid / totalPayments) * 100}% 100%
                          )`,
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full bg-indigo-500 shrink-0" />
                          <span className="text-gray-700">支払済み</span>
                        </div>
                        <span className="font-semibold text-gray-900">
                          {data.paymentBreakdown.paid}件 (
                          {totalPayments > 0
                            ? Math.round((data.paymentBreakdown.paid / totalPayments) * 100)
                            : 0}
                          %)
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full bg-yellow-400 shrink-0" />
                          <span className="text-gray-700">未払い</span>
                        </div>
                        <span className="font-semibold text-gray-900">
                          {data.paymentBreakdown.pending}件 (
                          {totalPayments > 0
                            ? Math.round((data.paymentBreakdown.pending / totalPayments) * 100)
                            : 0}
                          %)
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
          <BarChart2 className="h-10 w-10 mb-2 opacity-40" />
          <p className="text-sm">データを読み込めませんでした</p>
        </div>
      )}

      {/* ── 集客分析・ユーザー層 ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* User demographics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />ユーザー層分析
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: '小学生（6-12歳）', pct: 45, color: 'bg-blue-400' },
              { label: '中学生（13-15歳）', pct: 30, color: 'bg-indigo-400' },
              { label: '高校生（16-18歳）', pct: 18, color: 'bg-purple-400' },
              { label: 'その他', pct: 7, color: 'bg-gray-300' },
            ].map((row) => (
              <div key={row.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{row.label}</span>
                  <span className="font-semibold text-gray-900">{row.pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100">
                  <div className={`h-2 rounded-full ${row.color}`} style={{ width: `${row.pct}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Acquisition */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />集客分析（流入経路）
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'mairo検索', pct: 52, color: 'bg-indigo-500' },
              { label: '口コミ・紹介', pct: 24, color: 'bg-green-400' },
              { label: 'SNS', pct: 14, color: 'bg-pink-400' },
              { label: 'その他', pct: 10, color: 'bg-gray-300' },
            ].map((row) => (
              <div key={row.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{row.label}</span>
                  <span className="font-semibold text-gray-900">{row.pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100">
                  <div className={`h-2 rounded-full ${row.color}`} style={{ width: `${row.pct}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ── 指導者アナリティクス ─────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-purple-500" />指導者アナリティクス
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left p-3 font-medium text-gray-600">指導者名</th>
                  <th className="text-left p-3 font-medium text-gray-600">担当クラス</th>
                  <th className="text-left p-3 font-medium text-gray-600">予約数</th>
                  <th className="text-left p-3 font-medium text-gray-600">評価</th>
                  <th className="text-left p-3 font-medium text-gray-600">継続率</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[
                  { name: '田中 太郎', classes: 'サッカー・体操', bookings: 42, rating: 4.8, retention: '72%' },
                  { name: '山田 花子', classes: '水泳・ダンス', bookings: 38, rating: 4.6, retention: '68%' },
                  { name: '鈴木 一郎', classes: 'テニス・バドミントン', bookings: 29, rating: 4.5, retention: '61%' },
                ].map((inst) => (
                  <tr key={inst.name} className="hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-900">{inst.name}</td>
                    <td className="p-3 text-gray-500 text-xs">{inst.classes}</td>
                    <td className="p-3 text-gray-900">{inst.bookings}件</td>
                    <td className="p-3"><span className="text-yellow-500">★</span> {inst.rating}</td>
                    <td className="p-3 text-green-600 font-semibold">{inst.retention}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── AI Consultant ─────────────────────────────────────── */}
      <Card className="border-purple-100 bg-gradient-to-br from-purple-50 to-indigo-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="text-lg">🤖</span>AI Consultant 改善提案
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { icon: '📈', title: '予約率の改善', body: '木曜の夕方クラス（17-19時）は稼働率が42%と低めです。時間帯を15-17時に変更すると予約率が約25%改善する可能性があります。' },
            { icon: '💰', title: '料金最適化', body: '競合比較から、テニス・バドミントンクラスの価格が相場より12%低い傾向があります。品質訴求とセットで値上げを検討してください。' },
            { icon: '🏆', title: '継続率アップ', body: '初回参加から3週間以内の体験者へのフォローメッセージを送ると、継続率が平均18%向上する傾向があります。' },
          ].map((tip) => (
            <div key={tip.title} className="flex items-start gap-3 p-3 rounded-xl bg-white border border-purple-100">
              <span className="text-xl shrink-0">{tip.icon}</span>
              <div>
                <p className="text-sm font-semibold text-gray-900">{tip.title}</p>
                <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{tip.body}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── 競合比較指標 ─────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-orange-500" />競合比較指標（ベンチマーク）
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: '予約率', yours: '68%', avg: '54%', better: true },
              { label: '平均評価', yours: '4.6', avg: '4.2', better: true },
              { label: 'キャンセル率', yours: '12%', avg: '9%', better: false },
              { label: '継続参加率', yours: '67%', avg: '58%', better: true },
            ].map((m) => (
              <div key={m.label} className="text-center p-3 rounded-xl bg-gray-50">
                <p className="text-xs text-gray-500 mb-1">{m.label}</p>
                <p className={`text-xl font-bold ${m.better ? 'text-green-600' : 'text-red-500'}`}>{m.yours}</p>
                <p className="text-xs text-gray-400 mt-0.5">業界平均 {m.avg}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
