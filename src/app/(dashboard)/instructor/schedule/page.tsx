'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
// DISABLED: import { createClient } from '@/lib/supabase/client'
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
    // DISABLED (Supabase): const supabase = createClient()
    setLoading(true)
    // DISABLED (Supabase): supabase
      .from('activity_schedules')
      .select('*, activities(*)')
      .eq('instructor_id', user.id)
      .order('date_time', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) {
          setSchedules(data as unknown as ScheduleWithActivity[])
        }
        setLoading(false)
      })
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
      ) : viewMode === 'calendar' ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {format(weekStart, 'yyyy年M月', { locale: ja })}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setWeekStart(subWeeks(weekStart, 1))}
                  aria-label="前の週"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
                >
                  今週
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setWeekStart(addWeeks(weekStart, 1))}
                  aria-label="次の週"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
              {weekDays.map((day) => {
                const daySchedules = getSchedulesForDay(day)
                const isToday = isSameDay(day, today)
                return (
                  <div key={day.toISOString()} className="bg-white min-h-[140px]">
                    <div
                      className={`px-2 py-2 border-b border-gray-100 ${
                        isToday ? 'bg-indigo-50' : ''
                      }`}
                    >
                      <p className="text-[11px] font-medium text-gray-500 uppercase">
                        {format(day, 'EEE', { locale: ja })}
                      </p>
                      <p
                        className={`text-sm font-bold mt-0.5 ${
                          isToday ? 'text-indigo-600' : 'text-gray-900'
                        }`}
                      >
                        {format(day, 'd')}
                      </p>
                    </div>
                    <div className="p-1">
                      {daySchedules.map((s) => (
                        <ScheduleCard
                          key={s.id}
                          schedule={s}
                          onClick={() => setSelected(s)}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* List view */
        <Card>
          <CardContent className="p-0">
            {schedules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Calendar className="h-10 w-10 mb-3 opacity-40" />
                <p className="text-sm">スケジュールがありません</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {schedules.map((s) => {
                  const activity = s.activities
                  const color = getColor(activity?.category)
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelected(s)}
                      className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="shrink-0 text-center w-12">
                        <p className="text-xs font-medium text-gray-500">
                          {format(parseISO(s.date_time), 'M/d', { locale: ja })}
                        </p>
                        <p className="text-sm font-bold text-gray-900">
                          {format(parseISO(s.date_time), 'EEE', { locale: ja })}
                        </p>
                      </div>
                      <div className={`w-1.5 h-10 rounded-full flex-shrink-0 ${getColor(activity?.category).split(' ')[0]}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {activity?.title ?? '不明なアクティビティ'}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            {formatTime(s.date_time)}
                          </span>
                          {activity?.location && (
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <MapPin className="h-3 w-3" />
                              {activity.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Users className="h-3 w-3" />
                            定員 {s.capacity}名
                          </span>
                        </div>
                      </div>
                      {activity?.category && (
                        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full border ${color}`}>
                          {activity.category}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {selected.activities?.title ?? 'スケジュール詳細'}
              </h2>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-gray-700">
                <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                <span>{formatDate(selected.date_time)}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                <span>{formatTime(selected.date_time)}</span>
              </div>
              {selected.activities?.location && (
                <div className="flex items-center gap-3 text-gray-700">
                  <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                  <span>{selected.activities.location}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-gray-700">
                <Users className="h-4 w-4 text-gray-400 shrink-0" />
                <span>定員 {selected.capacity}名</span>
              </div>
              {selected.activities?.description && (
                <p className="text-gray-600 mt-2 leading-relaxed">
                  {selected.activities.description}
                </p>
              )}
            </div>
            <Button className="w-full mt-6" variant="outline" onClick={() => setSelected(null)}>
              閉じる
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
