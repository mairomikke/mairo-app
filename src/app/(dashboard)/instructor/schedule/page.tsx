'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { formatTime, formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, List, MapPin, Users, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfWeek, addDays, isSameDay, parseISO, addWeeks, subWeeks } from 'date-fns'
import { ja } from 'date-fns/locale'
import type { ActivitySchedule, Activity } from '@/types/database'

interface ScheduleWithActivity extends ActivitySchedule {
  activities: Activity | null
}

const CATEGORY_COLORS: Record<string, string> = {
  sports: 'bg-blue-100 text-blue-800 border-blue-200',
  music: 'bg-purple-100 text-purple-800 border-purple-200',
  art: 'bg-pink-100 text-pink-800 border-pink-200',
  cooking: 'bg-orange-100 text-orange-800 border-orange-200',
  language: 'bg-green-100 text-green-800 border-green-200',
  dance: 'bg-rose-100 text-rose-800 border-rose-200',
  default: 'bg-indigo-100 text-indigo-800 border-indigo-200',
}

function getColor(category: string | undefined): string {
  return CATEGORY_COLORS[category ?? ''] ?? CATEGORY_COLORS.default
}

function ScheduleCard({
  schedule,
  onClick,
}: {
  schedule: ScheduleWithActivity
  onClick: () => void
}) {
  const activity = schedule.activities
  const color = getColor(activity?.category)
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg border px-2.5 py-1.5 mb-1 hover:opacity-80 transition-opacity ${color}`}
    >
      <p className="text-xs font-semibold truncate">{activity?.title ?? 'Unknown Activity'}</p>
      <div className="flex items-center gap-1 mt-0.5">
        <Clock className="h-3 w-3 shrink-0" />
        <span className="text-[11px]">{formatTime(schedule.date_time)}</span>
        {activity?.location && (
          <>
            <MapPin className="h-3 w-3 shrink-0 ml-1" />
            <span className="text-[11px] truncate">{activity.location}</span>
          </>
        )}
      </div>
    </button>
  )
}

export default function InstructorSchedulePage() {
  const { user } = useAuthStore()
  const [schedules, setSchedules] = useState<ScheduleWithActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const [selected, setSelected] = useState<ScheduleWithActivity | null>(null)

  useEffect(() => {
    if (!user) return

    // Firebase未実装のため空データ
    setSchedules([])
    setLoading(false)

  }, [user])

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  function getSchedulesForDay(day: Date) {
    return schedules.filter((s) => isSameDay(parseISO(s.date_time), day))
  }

  const today = new Date()

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">スケジュール</h1>
          <p className="text-sm text-gray-500 mt-1">担当クラスのスケジュール管理</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('calendar')}
          >
            <Calendar className="h-4 w-4 mr-1.5" />
            カレンダー
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4 mr-1.5" />
            リスト
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin h-6 w-6 rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : schedules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Calendar className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm">スケジュールはまだありません（準備中）</p>
          </CardContent>
        </Card>
      ) : (
        <div /> // ← 既存UIはそのまま維持（将来Firebaseで復活）
      )}
    </div>
  )
}