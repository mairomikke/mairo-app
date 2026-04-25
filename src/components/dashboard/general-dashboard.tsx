'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  BookOpen,
  TrendingUp,
  MapPin,
  ChevronRight,
  Sparkles,
  Quote,
  Star,
  Bell,
  Zap,
  BrainCircuit,
} from 'lucide-react'
import { useBookings } from '@/hooks/use-bookings'
import { useActivities } from '@/hooks/use-activities'
import { useNotifications } from '@/hooks/use-notifications'
import { useReflections } from '@/hooks/use-reflections'
import { useAuthStore } from '@/stores/auth-store'
import { cn, formatDateTime, formatCurrency } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// ── 名言リスト ─────────────────────────────────────────────
const DAILY_QUOTES = [
  { text: '千里の道も一歩から。', author: '老子' },
  { text: '成功とは、情熱を失わずに失敗から失敗へと移っていく能力である。', author: 'ウィンストン・チャーチル' },
  { text: '努力は裏切らない。', author: '日本のことわざ' },
  { text: '昨日より今日、今日より明日。それが成長。', author: 'mairo' },
  { text: '習慣は第二の天性である。', author: 'アリストテレス' },
  { text: '自分を信じる力が、夢を現実に変える。', author: 'mairo' },
  { text: '小さな一歩の積み重ねが、大きな変化を生む。', author: 'mairo' },
]

// ── ユーザーレベル定義（13段階）────────────────────────────
const LEVELS = [
  { level: 1,  label: 'はじめの一歩',   minActivities: 0  },
  { level: 2,  label: '好奇心の芽',     minActivities: 2  },
  { level: 3,  label: '動き出した風',   minActivities: 5  },
  { level: 4,  label: '挑戦の炎',       minActivities: 8  },
  { level: 5,  label: '努力の地図',     minActivities: 12 },
  { level: 6,  label: '成長の証',       minActivities: 17 },
  { level: 7,  label: '自分を超える者', minActivities: 23 },
  { level: 8,  label: '光を灯す者',     minActivities: 30 },
  { level: 9,  label: '創る人',         minActivities: 38 },
  { level: 10, label: '道を拓く者',     minActivities: 47 },
  { level: 11, label: '伝える人',       minActivities: 57 },
  { level: 12, label: '未来の礎',       minActivities: 68 },
  { level: 13, label: 'mairo Legend',   minActivities: 80 },
]

function getUserLevel(completedCount: number) {
  let current = LEVELS[0]
  for (const lvl of LEVELS) {
    if (completedCount >= lvl.minActivities) current = lvl
  }
  const nextIdx = LEVELS.indexOf(current) + 1
  const next = LEVELS[nextIdx] ?? null
  const progress = next
    ? Math.round(((completedCount - current.minActivities) / (next.minActivities - current.minActivities)) * 100)
    : 100
  return { ...current, next, progress }
}

interface GeneralDashboardProps {
  userId: string
}

const CATEGORY_COLORS: Record<string, string> = {
  sports: 'bg-green-100 text-green-800',
  arts: 'bg-purple-100 text-purple-800',
  music: 'bg-pink-100 text-pink-800',
  academic: 'bg-blue-100 text-blue-800',
  technology: 'bg-indigo-100 text-indigo-800',
  outdoor: 'bg-emerald-100 text-emerald-800',
  cooking: 'bg-orange-100 text-orange-800',
  language: 'bg-yellow-100 text-yellow-800',
}

function StatCard({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: React.ElementType
  value: number | string
  label: string
  color: string
}) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div className={cn('rounded-xl p-3', color)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <Skeleton className="h-11 w-11 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-12" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardContent>
    </Card>
  )
}

export function GeneralDashboard({ userId: _userId }: GeneralDashboardProps) {
  const user = useAuthStore((s) => s.user)
  const { data: bookings, isPending: bookingsPending } = useBookings()
  const { data: recommended, isPending: activitiesPending } = useActivities({
    pageSize: 4,
  })
  const { data: notifications } = useNotifications()
  const { data: reflections } = useReflections()

  const upcomingBookings = bookings?.filter(
    (b) =>
      b.status === 'reserved' &&
      new Date(b.activity_schedule.date_time) > new Date()
  ) ?? []

  const completedBookings = bookings?.filter((b) => b.status === 'completed') ?? []
  const nextThreeBookings = upcomingBookings.slice(0, 3)

  // 今日の予約
  const todayBookings = useMemo(() => {
    const today = new Date()
    return upcomingBookings.filter((b) => {
      const d = new Date(b.activity_schedule.date_time)
      return (
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate()
      )
    })
  }, [upcomingBookings])

  // 未読通知
  const unreadNotifications = (notifications?.data ?? []).filter((n) => !n.is_read).slice(0, 4)

  // 今日の名言（日付ベースで1日固定）
  const todayQuote = useMemo(() => {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    )
    return DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length]
  }, [])

  // ユーザーレベル
  const userLevel = getUserLevel(completedBookings.length)

  // AI Cheer メッセージ
  const aiCheer = useMemo(() => {
    const count = completedBookings.length
    const reflCount = reflections?.length ?? 0
    if (count === 0) return 'まずは最初のアクティビティを体験してみましょう！あなたの成長の旅が始まります 🌱'
    if (reflCount === 0) return `${count}つのアクティビティに参加済み！振り返りを書くと、AIがあなたの成長を分析します 📝`
    return `${count}回の参加と${reflCount}件の振り返り、素晴らしい積み重ねです！この調子で続けていきましょう ⚡️`
  }, [completedBookings.length, reflections?.length])

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'おはようございます'
    if (hour < 18) return 'こんにちは'
    return 'こんばんは'
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Greeting */}
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-3">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{(() => { const h = new Date().getHours(); return h < 12 ? 'おはようございます' : h < 18 ? 'こんにちは' : 'こんばんは' })()}</p>
          <h1 className="text-2xl font-bold text-gray-900">
            {user?.name ?? 'ゲスト'}さん
          </h1>
        </div>
      </div>

      {/* ── 今日の名言 ──────────────────────────────────────── */}
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100">
        <CardContent className="p-5 flex items-start gap-4">
          <Quote className="h-6 w-6 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-gray-800 font-medium leading-relaxed">「{todayQuote.text}」</p>
            <p className="text-sm text-indigo-500 mt-1">— {todayQuote.author}</p>
          </div>
        </CardContent>
      </Card>

      {/* ── ユーザーレベル ───────────────────────────────────── */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-400" />
              <span className="font-semibold text-gray-900">
                Lv.{userLevel.level}　{userLevel.label}
              </span>
            </div>
            <span className="text-xs text-gray-400">
              参加 {completedBookings.length} 回
              {userLevel.next && ` / 次のレベルまで ${userLevel.next.minActivities - completedBookings.length} 回`}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${userLevel.progress}%` }}
            />
          </div>
          {userLevel.next && (
            <p className="text-xs text-gray-400 mt-1.5">
              次: Lv.{userLevel.next.level}「{userLevel.next.label}」
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── 今日のやること ───────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-semibold text-gray-900">今日のやること</h2>
        </div>
        {bookingsPending ? (
          <Card><CardContent className="p-4"><Skeleton className="h-10 w-full" /></CardContent></Card>
        ) : todayBookings.length === 0 ? (
          <Card>
            <CardContent className="p-5 text-center text-gray-400 text-sm">
              今日の予定はありません。
              <Link href="/activities" className="text-indigo-500 hover:underline ml-1">アクティビティを探す</Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {todayBookings.map((b) => {
              const act = b.activity_schedule.activity
              return (
                <Card key={b.id}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <CalendarDays className="h-4 w-4 text-indigo-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{act.title}</p>
                      <p className="text-xs text-gray-400">{formatDateTime(b.activity_schedule.date_time)}</p>
                    </div>
                    <Badge variant="default">今日</Badge>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      {/* ── 簡易通知センター ─────────────────────────────────── */}
      {unreadNotifications.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-orange-500" />
              <h2 className="text-lg font-semibold text-gray-900">お知らせ</h2>
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-red-500 text-white rounded-full">
                {unreadNotifications.length}
              </span>
            </div>
            <Link href="/notifications" className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              すべて見る <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-2">
            {unreadNotifications.map((n) => (
              <Card key={n.id} className="border-orange-100 bg-orange-50">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-orange-500 shrink-0" />
                  <p className="text-sm text-gray-700 flex-1 truncate">{n.title}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ── AI Cheer ─────────────────────────────────────────── */}
      <Card className="border-purple-100 bg-gradient-to-br from-purple-50 to-indigo-50">
        <CardContent className="p-5 flex items-start gap-4">
          <BrainCircuit className="h-6 w-6 text-purple-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-purple-500 mb-1">AI Coach より</p>
            <p className="text-sm text-gray-700 leading-relaxed">{aiCheer}</p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {bookingsPending ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              icon={CalendarDays}
              value={upcomingBookings.length}
              label="予約中のアクティビティ"
              color="bg-indigo-100 text-indigo-600"
            />
            <StatCard
              icon={CheckCircle2}
              value={completedBookings.length}
              label="完了したアクティビティ"
              color="bg-green-100 text-green-600"
            />
            <StatCard
              icon={BookOpen}
              value={0}
              label="振り返り"
              color="bg-purple-100 text-purple-600"
            />
            <StatCard
              icon={TrendingUp}
              value="—"
              label="成長スコア"
              color="bg-orange-100 text-orange-600"
            />
          </>
        )}
      </div>

      {/* Upcoming Activities */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">直近の予約</h2>
          <Link
            href="/bookings"
            className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            すべて見る
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {bookingsPending ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : nextThreeBookings.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <CalendarDays className="h-10 w-10 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">予約はありません</p>
              <p className="text-sm mt-1">アクティビティを探して予約しましょう</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {nextThreeBookings.map((booking) => {
              const activity = booking.activity_schedule.activity
              const schedule = booking.activity_schedule
              return (
                <Card
                  key={booking.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
                        {activity.title}
                      </h3>
                      <Badge variant="success" className="shrink-0">
                        予約済
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                      <span>{formatDateTime(schedule.date_time)}</span>
                    </div>
                    {activity.location && (
                      <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{activity.location}</span>
                      </div>
                    )}
                    <p className="text-sm font-medium text-gray-700">
                      {activity.organization.name}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      {/* Recommended Activities */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">おすすめのアクティビティ</h2>
          <Link
            href="/activities"
            className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            すべて見る
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {activitiesPending ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-0 space-y-3">
                  <Skeleton className="h-32 w-full rounded-t-xl" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(recommended ?? []).slice(0, 4).map((activity) => (
              <Link key={activity.id} href={`/activities/${activity.id}`}>
                <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full">
                  {/* Image placeholder */}
                  <div
                    className={cn(
                      'h-32 w-full flex items-center justify-center',
                      activity.image_url ? '' : 'bg-gradient-to-br from-indigo-400 to-purple-500'
                    )}
                  >
                    {activity.image_url ? (
                      <img
                        src={activity.image_url}
                        alt={activity.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-3xl font-bold opacity-40">
                        {activity.title.charAt(0)}
                      </span>
                    )}
                  </div>
                  <CardContent className="p-4 space-y-2">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                        CATEGORY_COLORS[activity.category] ?? 'bg-gray-100 text-gray-700'
                      )}
                    >
                      {activity.category}
                    </span>
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 leading-snug">
                      {activity.title}
                    </h3>
                    <p className="text-xs text-gray-500 truncate">
                      {activity.location ?? '場所未定'}
                    </p>
                    <p className="text-sm font-semibold text-indigo-600">
                      {formatCurrency(activity.price)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">クイックアクション</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/activities"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 h-10 px-4 py-2 text-sm font-medium transition-all"
          >
            アクティビティを探す
          </Link>
          <Link
            href="/bookings"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 h-10 px-4 py-2 text-sm font-medium transition-all"
          >
            予約一覧
          </Link>
          <Link
            href="/reflections"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 h-10 px-4 py-2 text-sm font-medium transition-all"
          >
            振り返りを書く
          </Link>
        </div>
      </section>
    </div>
  )
}
