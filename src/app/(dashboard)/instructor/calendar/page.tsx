'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuthStore } from '@/stores/auth-store'
// DISABLED: import { createClient } from '@/lib/supabase/client'
import { cn, formatTime } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Clock, MapPin, Users, X } from 'lucide-react'
import type { ActivitySchedule, Activity } from '@/types/database'

interface ScheduleWithActivity extends ActivitySchedule { activity: Activity }

// ── Dummy schedules for immediate display ─────────────────────────────────────
function generateDummySchedules() {
  const today = new Date()
  const y = today.getFullYear()
  const m = today.getMonth()
  return [
    { id: 'd1', date: new Date(y, m, today.getDate()), title: 'サッカー教室（初級）', time: '15:00', location: '渋谷スポーツセンター', capacity: 15, participants: 12, org: 'マイロスポーツ' },
    { id: 'd2', date: new Date(y, m, today.getDate()), title: '体操教室（中級）', time: '17:30', location: '渋谷体育館 第2F', capacity: 10, participants: 8, org: 'マイロスポーツ' },
    { id: 'd3', date: new Date(y, m, today.getDate() + 2), title: 'テニスクラス（入門）', time: '10:00', location: '新宿テニスコート', capacity: 8, participants: 6, org: 'アカデミースポーツ' },
    { id: 'd4', date: new Date(y, m, today.getDate() + 5), title: 'サッカー教室（初級）', time: '15:00', location: '渋谷スポーツセンター', capacity: 15, participants: 10, org: 'マイロスポーツ' },
    { id: 'd5', date: new Date(y, m, today.getDate() + 7), title: '体操教室（中級）', time: '17:30', location: '渋谷体育館 第2F', capacity: 10, participants: 7, org: 'マイロスポーツ' },
    { id: 'd6', date: new Date(y, m, today.getDate() + 9), title: 'テニスクラス（入門）', time: '10:00', location: '新宿テニスコート', capacity: 8, participants: 5, org: 'アカデミースポーツ' },
    { id: 'd7', date: new Date(y, m, today.getDate() + 12), title: 'サッカー教室（初級）', time: '15:00', location: '渋谷スポーツセンター', capacity: 15, participants: 11, org: 'マイロスポーツ' },
  ]
}

type DummySession = ReturnType<typeof generateDummySchedules>[0]

// ── Session Detail Modal ──────────────────────────────────────────────────────
function SessionModal({ session, onClose }: { session: DummySession; onClose: () => void }) {
  const occupancy = Math.round((session.participants / session.capacity) * 100)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Badge variant="default" className="mb-2 text-xs">{session.org}</Badge>
                <CardTitle className="text-lg">{session.title}</CardTitle>
              </div>
              <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 shrink-0"><X className="h-5 w-5 text-gray-400" /></button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4 text-indigo-400" />
                <span>{session.time}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="h-4 w-4 text-indigo-400" />
                <span>{session.participants}/{session.capacity}名</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 col-span-2">
                <MapPin className="h-4 w-4 text-indigo-400" />
                <span>{session.location}</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>参加率</span>
                <span className={occupancy >= 80 ? 'text-red-500 font-semibold' : 'text-green-600 font-semibold'}>{occupancy}%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100">
                <div className={cn('h-2 rounded-full', occupancy >= 80 ? 'bg-red-400' : 'bg-green-400')} style={{ width: `${occupancy}%` }} />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button className="flex-1" size="sm" onClick={onClose}>参加者管理へ</Button>
              <Button variant="outline" size="sm" onClick={onClose}>閉じる</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ── Calendar ──────────────────────────────────────────────────────────────────
export default function InstructorCalendarPage() {
  const { user } = useAuthStore()
  const [viewDate, setViewDate] = useState(new Date())
  const [selected, setSelected] = useState<DummySession | null>(null)
  const [dbSchedules, setDbSchedules] = useState<ScheduleWithActivity[]>([])

  useEffect(() => {
    if (!user) return
    const fetchData = async () => {
      // DISABLED (Supabase): const supabase = createClient()
      // DISABLED (Supabase): const { data } = await supabase
        .from('activity_schedules')
        .select('*, activity:activities(*)')
        .eq('instructor_id', user.id)
        .order('date_time', { ascending: true })
      if (data) setDbSchedules(data as unknown as ScheduleWithActivity[])
    }
    fetchData()
  }, [user])

  const dummySessions = useMemo(() => generateDummySchedules(), [])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthLabel = viewDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })
  const today = new Date()

  // Map sessions to days
  const sessionsByDay = useMemo(() => {
    const map: Record<number, DummySession[]> = {}
    dummySessions.forEach((s) => {
      if (s.date.getFullYear() === year && s.date.getMonth() === month) {
        const d = s.date.getDate()
        if (!map[d]) map[d] = []
        map[d].push(s)
      }
    })
    // also add DB schedules
    dbSchedules.forEach((s) => {
      const d = new Date(s.date_time)
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate()
        if (!map[day]) map[day] = []
        map[day].push({ id: s.id, date: d, title: s.activity.title, time: d.toTimeString().slice(0, 5), location: s.activity.location ?? '', capacity: s.capacity, participants: 0, org: 'DB' })
      }
    })
    return map
  }, [dummySessions, dbSchedules, year, month])

  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  // Selected day sessions
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const daySessions = selectedDay ? (sessionsByDay[selectedDay] ?? []) : []

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">カレンダー</h1>
        <p className="text-gray-500 mt-1">担当セッションのスケジュール</p>
      </div>

      {/* Month nav */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{monthLabel}</CardTitle>
            <div className="flex items-center gap-1">
              <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-2 rounded-lg hover:bg-gray-100 transition-colors"><ChevronLeft className="h-4 w-4" /></button>
              <button onClick={() => setViewDate(new Date())} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors font-medium">今月</button>
              <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-2 rounded-lg hover:bg-gray-100 transition-colors"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {['日','月','火','水','木','金','土'].map((d, i) => (
              <div key={d} className={cn('text-center text-xs font-medium py-2', i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400')}>{d}</div>
            ))}
          </div>
          {/* Cells */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />
              const isToday = day === today.getDate() && year === today.getFullYear() && month === today.getMonth()
              const isSelected = day === selectedDay
              const sessions = sessionsByDay[day] ?? []
              const dow = (firstDay + day - 1) % 7
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                  className={cn(
                    'relative flex flex-col items-center min-h-[52px] p-1 rounded-xl text-sm transition-all',
                    isToday ? 'bg-indigo-600 text-white' : isSelected ? 'bg-indigo-100 text-indigo-900 ring-2 ring-indigo-400' : 'hover:bg-gray-50',
                    dow === 0 && !isToday && 'text-red-500',
                    dow === 6 && !isToday && 'text-blue-500',
                  )}
                >
                  <span className="font-medium">{day}</span>
                  {sessions.length > 0 && (
                    <div className="flex flex-col gap-0.5 w-full mt-0.5">
                      {sessions.slice(0, 2).map((s) => (
                        <span key={s.id} className={cn('text-[9px] leading-tight px-1 rounded truncate w-full', isToday ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700')}>{s.title.slice(0, 6)}</span>
                      ))}
                      {sessions.length > 2 && <span className={cn('text-[9px] text-center', isToday ? 'text-white/70' : 'text-gray-400')}>+{sessions.length - 2}</span>}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected day sessions */}
      {selectedDay && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-gray-900">
            {month + 1}月{selectedDay}日のセッション
          </h2>
          {daySessions.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-gray-400 text-sm">この日のセッションはありません</CardContent></Card>
          ) : (
            daySessions.map((s) => (
              <button key={s.id} onClick={() => setSelected(s)} className="w-full text-left">
                <Card className="hover:shadow-md transition-shadow hover:border-indigo-200">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">{s.org}</Badge>
                        <p className="font-semibold text-gray-900 truncate">{s.title}</p>
                      </div>
                      <div className="flex gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{s.time}</span>
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{s.participants}/{s.capacity}名</span>
                        {s.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{s.location}</span>}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                  </CardContent>
                </Card>
              </button>
            ))
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-400 pt-2">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-indigo-600" />今日</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-6 rounded bg-indigo-100" />セッションあり</span>
      </div>

      {/* Modal */}
      {selected && <SessionModal session={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
