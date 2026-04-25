'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
// DISABLED: import { createClient } from '@/lib/supabase/client'
import { formatDate, formatTime } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import {
  QrCode,
  CheckCircle2,
  UserCheck,
  Clock,
  AlertCircle,
  Search,
  Users,
} from 'lucide-react'
import type { ActivitySchedule, Activity, Booking, Profile } from '@/types/database'

interface ScheduleWithActivity extends ActivitySchedule {
  activities: Activity | null
}

interface BookingWithProfile extends Booking {
  profiles: Profile | null
  activity_schedules: ScheduleWithActivity | null
}

interface AttendanceRecord {
  booking: BookingWithProfile
  markedAt: string
}

export default function AttendancePage() {
  const { user } = useAuthStore()
  const [qrInput, setQrInput] = useState('')
  const [scanning, setScanning] = useState(false)
  const [scannedBooking, setScannedBooking] = useState<BookingWithProfile | null>(null)
  const [scanError, setScanError] = useState('')
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([])
  const [todaySchedules, setTodaySchedules] = useState<ScheduleWithActivity[]>([])
  const [selectedSchedule, setSelectedSchedule] = useState<string>('')
  const [confirming, setConfirming] = useState(false)
  const [loadingSchedules, setLoadingSchedules] = useState(true)
  const [manualSearch, setManualSearch] = useState('')
  const [manualResults, setManualResults] = useState<BookingWithProfile[]>([])

  // Load today's schedules for this instructor
  useEffect(() => {
    if (!user) return
    // DISABLED (Supabase): const supabase = createClient()
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    // DISABLED (Supabase): supabase
      .from('activity_schedules')
      .select('*, activities(*)')
      .eq('instructor_id', user.id)
      .gte('date_time', todayStart.toISOString())
      .lte('date_time', todayEnd.toISOString())
      .order('date_time', { ascending: true })
      .then(({ data }) => {
        if (data) {
          const schedules = data as unknown as ScheduleWithActivity[]
          setTodaySchedules(schedules)
          if (schedules.length > 0) setSelectedSchedule(schedules[0].id)
        }
        setLoadingSchedules(false)
      })
  }, [user])

  async function handleQrScan() {
    if (!qrInput.trim() || !selectedSchedule) return
    setScanning(true)
    setScanError('')
    setScannedBooking(null)

    // DISABLED (Supabase): const supabase = createClient()
    // Look up QR data → user → booking for current schedule
    // DISABLED (Supabase): const { data: qrData } = await supabase
      .from('qr_auth')
      .select('user_id')
      .eq('qr_data', qrInput.trim())
      .single()

    if (!qrData) {
      setScanError('QRコードが見つかりませんでした。もう一度お試しください。')
      setScanning(false)
      return
    }

    const qr = qrData as unknown as { user_id: string }
    // DISABLED (Supabase): const { data: booking } = await supabase
      .from('bookings')
      .select('*, profiles(*), activity_schedules(*, activities(*))')
      .eq('user_id', qr.user_id)
      .eq('schedule_id', selectedSchedule)
      .eq('status', 'reserved')
      .single()

    if (!booking) {
      setScanError('この日程に有効な予約が見つかりませんでした。')
      setScanning(false)
      return
    }

    setScannedBooking(booking as unknown as BookingWithProfile)
    setQrInput('')
    setScanning(false)
  }

  async function handleConfirmAttendance() {
    if (!scannedBooking) return
    setConfirming(true)
    // DISABLED (Supabase): const supabase = createClient()
    // DISABLED (Supabase): const { error } = await supabase
      .from('bookings')
      .update({ status: 'completed' } as never)
      .eq('id', scannedBooking.id)

    if (!error) {
      setAttendanceList((prev) => [
        { booking: scannedBooking, markedAt: new Date().toISOString() },
        ...prev,
      ])
      setScannedBooking(null)
    }
    setConfirming(false)
  }

  async function handleManualSearch() {
    if (!manualSearch.trim() || !selectedSchedule) return
    // DISABLED (Supabase): const supabase = createClient()
    // DISABLED (Supabase): const { data } = await supabase
      .from('bookings')
      .select('*, profiles(*), activity_schedules(*, activities(*))')
      .eq('schedule_id', selectedSchedule)
      .eq('status', 'reserved')

    if (data) {
      const filtered = (data as unknown as BookingWithProfile[]).filter(
        (b) =>
          b.profiles?.name?.toLowerCase().includes(manualSearch.toLowerCase()) ||
          b.profiles?.email?.toLowerCase().includes(manualSearch.toLowerCase())
      )
      setManualResults(filtered)
    }
  }

  async function handleManualMark(booking: BookingWithProfile) {
    // DISABLED (Supabase): const supabase = createClient()
    // DISABLED (Supabase): const { error } = await supabase
      .from('bookings')
      .update({ status: 'completed' } as never)
      .eq('id', booking.id)

    if (!error) {
      setAttendanceList((prev) => [
        { booking, markedAt: new Date().toISOString() },
        ...prev,
      ])
      setManualResults((prev) => prev.filter((b) => b.id !== booking.id))
    }
  }

  const currentSchedule = todaySchedules.find((s) => s.id === selectedSchedule)

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">出席管理</h1>
        <p className="text-sm text-gray-500 mt-1">QRコードで出席を確認します</p>
      </div>

      {/* Schedule selector */}
      {!loadingSchedules && todaySchedules.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-600" />
              本日のクラスを選択
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {todaySchedules.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSchedule(s.id)}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    selectedSchedule === s.id
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {s.activities?.title ?? 'クラス'} — {formatTime(s.date_time)}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {loadingSchedules ? (
        <div className="flex items-center justify-center h-24">
          <div className="animate-spin h-6 w-6 rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : todaySchedules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Users className="h-10 w-10 mb-2 opacity-40" />
            <p className="text-sm">本日担当のクラスはありません</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            {/* QR Scan Panel */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-indigo-600" />
                  QRコードスキャン
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Scan area visual */}
                <div className="relative flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl h-36">
                  <QrCode className="h-16 w-16 text-gray-300" />
                  <div className="absolute inset-3 border-2 border-indigo-300 rounded-lg opacity-50 pointer-events-none" />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    QRデータを入力（開発用）
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={qrInput}
                      onChange={(e) => setQrInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleQrScan()}
                      placeholder="QRコードデータをペースト..."
                      className="flex-1"
                    />
                    <Button
                      onClick={handleQrScan}
                      isLoading={scanning}
                      disabled={!qrInput.trim() || !selectedSchedule}
                    >
                      確認
                    </Button>
                  </div>
                </div>

                {scanError && (
                  <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    {scanError}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Scanned student confirmation */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-indigo-600" />
                  生徒確認
                </CardTitle>
              </CardHeader>
              <CardContent>
                {scannedBooking ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                      <Avatar
                        src={scannedBooking.profiles?.avatar_url}
                        name={scannedBooking.profiles?.name}
                        size="lg"
                      />
                      <div>
                        <p className="font-semibold text-gray-900">
                          {scannedBooking.profiles?.name ?? '不明'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {scannedBooking.profiles?.email}
                        </p>
                        <p className="text-xs text-indigo-600 mt-1 font-medium">
                          {currentSchedule?.activities?.title} —{' '}
                          {currentSchedule && formatTime(currentSchedule.date_time)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={handleConfirmAttendance}
                        isLoading={confirming}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1.5" />
                        出席確認
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setScannedBooking(null)}
                        disabled={confirming}
                      >
                        キャンセル
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                    <UserCheck className="h-8 w-8 mb-2 opacity-40" />
                    <p className="text-sm">QRコードをスキャン後に</p>
                    <p className="text-sm">生徒情報が表示されます</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Manual attendance */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Search className="h-4 w-4 text-indigo-600" />
                手動出席確認
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={manualSearch}
                  onChange={(e) => setManualSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                  placeholder="生徒名またはメールアドレスで検索..."
                  className="flex-1"
                />
                <Button variant="outline" onClick={handleManualSearch}>
                  検索
                </Button>
              </div>
              {manualResults.length > 0 && (
                <div className="space-y-2">
                  {manualResults.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={b.profiles?.avatar_url}
                          name={b.profiles?.name}
                          size="sm"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{b.profiles?.name}</p>
                          <p className="text-xs text-gray-500">{b.profiles?.email}</p>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => handleManualMark(b)}>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        出席
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's attendance list */}
          {attendanceList.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  本日の出席済み（{attendanceList.length}名）
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  {attendanceList.map((record, idx) => (
                    <div key={idx} className="flex items-center gap-3 px-6 py-3">
                      <Avatar
                        src={record.booking.profiles?.avatar_url}
                        name={record.booking.profiles?.name}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {record.booking.profiles?.name}
                        </p>
                        <p className="text-xs text-gray-500">{record.booking.profiles?.email}</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {formatTime(record.markedAt)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
