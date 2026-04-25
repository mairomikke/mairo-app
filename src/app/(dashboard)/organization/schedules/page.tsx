'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { formatDateTime, formatDate, formatTime } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import {
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Clock,
  Users,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, startOfWeek, addDays, isSameDay, parseISO, addMonths, subMonths, isSameMonth } from 'date-fns'
import { ja } from 'date-fns/locale'
import type { Activity, ActivitySchedule, Profile } from '@/types/database'

interface ScheduleWithInstructor extends ActivitySchedule {
  profiles: Profile | null
}

interface ScheduleFormState {
  date: string
  time: string
  capacity: string
  instructor_id: string
}

const EMPTY_FORM: ScheduleFormState = {
  date: '',
  time: '',
  capacity: '',
  instructor_id: '',
}

export default function OrgSchedulesPage() {
  const { user } = useAuthStore()
  const [orgId, setOrgId] = useState<string | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [selectedActivity, setSelectedActivity] = useState<string>('')
  const [schedules, setSchedules] = useState<ScheduleWithInstructor[]>([])
  const [instructors, setInstructors] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const [addOpen, setAddOpen] = useState(false)
  const [editSchedule, setEditSchedule] = useState<ScheduleWithInstructor | null>(null)
  const [deleteSchedule, setDeleteSchedule] = useState<ScheduleWithInstructor | null>(null)
  const [form, setForm] = useState<ScheduleFormState>(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!user) return
    setOrgId('mock-org')
    loadActivities('mock-org')
    loadInstructors('mock-org')
  }, [user])

  async function loadActivities(oid: string) {
    setActivities([])
  }

  async function loadInstructors(oid: string) {
    setInstructors([])
  }

  useEffect(() => {
    if (!selectedActivity) return
    loadSchedules()
  }, [selectedActivity])

  async function loadSchedules() {
    setLoading(true)
    setSchedules([])
    setLoading(false)
  }

  function openAddForm() {
    setForm(EMPTY_FORM)
    setFormError('')
    setAddOpen(true)
  }

  function openEditForm(s: ScheduleWithInstructor) {
    const dt = parseISO(s.date_time)
    setForm({
      date: format(dt, 'yyyy-MM-dd'),
      time: format(dt, 'HH:mm'),
      capacity: String(s.capacity),
      instructor_id: s.instructor_id ?? '',
    })
    setFormError('')
    setEditSchedule(s)
  }

  async function handleSubmitForm() {
    if (!form.date || !form.time || !form.capacity) {
      setFormError('日付・時刻・定員は必須です')
      return
    }
    const cap = parseInt(form.capacity, 10)
    if (isNaN(cap) || cap < 1) {
      setFormError('定員は1以上の数値を入力してください')
      return
    }
    setSubmitting(true)
    setFormError('')

    if (editSchedule) {
      setEditSchedule(null)
    } else {
      setAddOpen(false)
    }

    await loadSchedules()
    setSubmitting(false)
  }

  async function handleDelete() {
    if (!deleteSchedule) return
    setDeleting(true)
    setDeleteSchedule(null)
    await loadSchedules()
    setDeleting(false)
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calDays: Date[] = []
  let d = calStart
  while (d <= monthEnd || calDays.length % 7 !== 0) {
    calDays.push(d)
    d = addDays(d, 1)
    if (calDays.length > 42) break
  }

  function schedulesForDay(day: Date) {
    return schedules.filter((s) => isSameDay(parseISO(s.date_time), day))
  }

  const ScheduleFormContent = () => (
    <div className="space-y-4">
      {formError && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {formError}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="日付"
          type="date"
          value={form.date}
          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
        />
        <Input
          label="時刻"
          type="time"
          value={form.time}
          onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
        />
      </div>
      <Input
        label="定員（名）"
        type="number"
        min={1}
        value={form.capacity}
        onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
        placeholder="20"
      />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          担当インストラクター（任意）
        </label>
        <Select
          value={form.instructor_id}
          onValueChange={(v) => setForm((f) => ({ ...f, instructor_id: v }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="インストラクターを選択（任意）" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">指定なし</SelectItem>
            {instructors.map((ins) => (
              <SelectItem key={ins.id} value={ins.id}>
                {ins.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <Button
          variant="outline"
          onClick={() => { setAddOpen(false); setEditSchedule(null) }}
          disabled={submitting}
        >
          キャンセル
        </Button>
        <Button onClick={handleSubmitForm} isLoading={submitting}>
          {editSchedule ? '更新する' : '追加する'}
        </Button>
      </div>
    </div>
  )

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">スケジュール管理</h1>
          <p className="text-sm text-gray-500 mt-1">アクティビティごとのスケジュールを管理</p>
        </div>
        <Button onClick={openAddForm} disabled={!selectedActivity}>
          <Plus className="h-4 w-4 mr-1.5" />
          スケジュール追加
        </Button>
      </div>

      {/* Activity selector */}
      {activities.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700 shrink-0">
                アクティビティを選択:
              </label>
              <Select value={selectedActivity} onValueChange={setSelectedActivity}>
                <SelectTrigger className="max-w-xs">
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {activities.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedActivity && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Calendar */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {format(currentMonth, 'yyyy年M月', { locale: ja })}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-7 text-center mb-1">
                {['月', '火', '水', '木', '金', '土', '日'].map((day) => (
                  <div key={day} className="text-xs font-medium text-gray-500 py-1">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
                {calDays.map((day, i) => {
                  const daySchedules = schedulesForDay(day)
                  const inMonth = isSameMonth(day, currentMonth)
                  const isToday = isSameDay(day, new Date())
                  return (
                    <div
                      key={i}
                      className={`bg-white min-h-[64px] p-1 ${!inMonth ? 'opacity-40' : ''}`}
                    >
                      <p
                        className={`text-xs font-medium text-right mb-1 ${
                          isToday
                            ? 'text-white bg-indigo-600 rounded-full w-5 h-5 flex items-center justify-center ml-auto'
                            : 'text-gray-700'
                        }`}
                      >
                        {format(day, 'd')}
                      </p>
                      {daySchedules.slice(0, 2).map((s) => (
                        <div
                          key={s.id}
                          className="text-[10px] bg-indigo-100 text-indigo-700 rounded px-1 py-0.5 truncate mb-0.5"
                        >
                          {formatTime(s.date_time)}
                        </div>
                      ))}
                      {daySchedules.length > 2 && (
                        <div className="text-[10px] text-gray-400">+{daySchedules.length - 2}</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Schedule list */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">スケジュール一覧</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin h-5 w-5 rounded-full border-2 border-indigo-600 border-t-transparent" />
                </div>
              ) : schedules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Calendar className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm">スケジュールがありません</p>
                </div>
              ) : (
                <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-100">
                  {schedules.map((s) => (
                    <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="shrink-0 text-center">
                        <p className="text-xs font-medium text-gray-500">
                          {format(parseISO(s.date_time), 'M/d', { locale: ja })}
                        </p>
                        <p className="text-xs text-indigo-600 font-semibold">
                          {formatTime(s.date_time)}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Users className="h-3 w-3" />
                          <span>定員 {s.capacity}名</span>
                        </div>
                        {s.profiles && (
                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            担当: {s.profiles.name}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEditForm(s)}
                          aria-label="編集"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeleteSchedule(s)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          aria-label="削除"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add modal */}
      <Modal open={addOpen} onOpenChange={setAddOpen} title="スケジュールを追加">
        <ScheduleFormContent />
      </Modal>

      {/* Edit modal */}
      <Modal
        open={!!editSchedule}
        onOpenChange={(open) => { if (!open) setEditSchedule(null) }}
        title="スケジュールを編集"
      >
        <ScheduleFormContent />
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={!!deleteSchedule}
        onOpenChange={(open) => { if (!open) setDeleteSchedule(null) }}
        title="スケジュールを削除"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            {deleteSchedule && formatDateTime(deleteSchedule.date_time)} のスケジュールを削除しますか？
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteSchedule(null)} disabled={deleting}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={handleDelete} isLoading={deleting}>
              削除する
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
