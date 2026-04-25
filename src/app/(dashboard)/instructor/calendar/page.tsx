'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Clock, MapPin, Users, X } from 'lucide-react'
import type { ActivitySchedule, Activity } from '@/types/database'

interface ScheduleWithActivity extends ActivitySchedule { activity: Activity }

// ── Dummy schedules ─────────────────────────────────────
function generateDummySchedules() {
  const today = new Date()
  const y = today.getFullYear()
  const m = today.getMonth()
  return [
    { id: 'd1', date: new Date(y, m, today.getDate()), title: 'サッカー教室（初級）', time: '15:00', location: '渋谷スポーツセンター', capacity: 15, participants: 12, org: 'マイロスポーツ' },
    { id: 'd2', date: new Date(y, m, today.getDate()), title: '体操教室（中級）', time: '17:30', location: '渋谷体育館 第2F', capacity: 10, participants: 8, org: 'マイロスポーツ' },
  ]
}

type DummySession = ReturnType<typeof generateDummySchedules>[0]

// ── Modal ───────────────────────────────────────────────
function SessionModal({ session, onClose }: { session: DummySession; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <Card>
          <CardHeader>
            <CardTitle>{session.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{session.time}</p>
            <p>{session.location}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ── Main ────────────────────────────────────────────────
export default function InstructorCalendarPage() {
  const { user } = useAuthStore()
  const [viewDate, setViewDate] = useState(new Date())
  const [selected, setSelected] = useState<DummySession | null>(null)

  useEffect(() => {
    if (!user) return
  }, [user])

  const dummySessions = useMemo(() => generateDummySchedules(), [])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const sessionsByDay = useMemo(() => {
    const map: Record<number, DummySession[]> = {}
    dummySessions.forEach((s) => {
      if (s.date.getMonth() === month) {
        const d = s.date.getDate()
        if (!map[d]) map[d] = []
        map[d].push(s)
      }
    })
    return map
  }, [dummySessions, month])

  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">カレンダー</h1>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const sessions = sessionsByDay[day] ?? []
          return (
            <button key={i} onClick={() => sessions[0] && setSelected(sessions[0])}>
              {day}
              {sessions.length > 0 && <div className="text-xs text-indigo-500">●</div>}
            </button>
          )
        })}
      </div>

      {selected && <SessionModal session={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}