'use client'

import { useState } from 'react'
import { CheckCircle2, Users, Calendar, Clock, AlertCircle } from 'lucide-react'
import { useCreateBooking } from '@/hooks/use-bookings'
import { cn, formatDateTime, formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { ActivitySchedule, Activity } from '@/types/database'

interface BookingFormProps {
  activity: Activity
  schedules: ActivitySchedule[]
  bookingCounts: Record<string, number>
}

export function BookingForm({ activity, schedules, bookingCounts }: BookingFormProps) {
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(
    schedules.length === 1 ? schedules[0].id : null
  )
  const [success, setSuccess] = useState(false)
  const { mutate: createBooking, isPending, error } = useCreateBooking()

  const selectedSchedule = schedules.find((s) => s.id === selectedScheduleId)
  const spotsLeft = selectedSchedule
    ? selectedSchedule.capacity - (bookingCounts[selectedSchedule.id] ?? 0)
    : null

  const handleBook = () => {
    if (!selectedScheduleId) return
    createBooking(
      {
        schedule_id: selectedScheduleId,
        status: 'reserved',
        payment_status: 'pending',
        user_id: '', // set by server / RLS
      } as never,
      {
        onSuccess: () => setSuccess(true),
      }
    )
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
        <div className="rounded-full bg-green-100 p-4">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">予約が完了しました！</h3>
        <p className="text-sm text-gray-500">
          {selectedSchedule && formatDateTime(selectedSchedule.date_time)}の予約を受け付けました。
        </p>
        <p className="text-sm text-gray-500">
          確認メールをお送りします。
        </p>
        <a
          href="/bookings"
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors mt-2"
        >
          予約一覧へ
        </a>
      </div>
    )
  }

  if (schedules.length === 0) {
    return (
      <div className="py-6 text-center text-gray-500">
        <Calendar className="h-10 w-10 mx-auto mb-3 text-gray-300" />
        <p className="font-medium">利用可能なスケジュールがありません</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">日時を選択</h3>
        <div className="space-y-2">
          {schedules.map((schedule) => {
            const booked = bookingCounts[schedule.id] ?? 0
            const available = schedule.capacity - booked
            const isFull = available <= 0
            const isSelected = selectedScheduleId === schedule.id

            return (
              <label
                key={schedule.id}
                className={cn(
                  'flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                  isFull
                    ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                    : isSelected
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50'
                )}
              >
                <input
                  type="radio"
                  name="schedule"
                  value={schedule.id}
                  checked={isSelected}
                  disabled={isFull}
                  onChange={() => setSelectedScheduleId(schedule.id)}
                  className="mt-0.5 h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                    <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                    {formatDateTime(schedule.date_time)}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Users className="h-3.5 w-3.5 text-gray-400" />
                    {isFull ? (
                      <span className="text-xs text-red-500 font-medium">満員</span>
                    ) : (
                      <span
                        className={cn(
                          'text-xs font-medium',
                          available <= 3 ? 'text-orange-500' : 'text-green-600'
                        )}
                      >
                        残り{available}席
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      / 定員{schedule.capacity}名
                    </span>
                  </div>
                </div>
              </label>
            )
          })}
        </div>
      </div>

      {/* Capacity indicator */}
      {selectedSchedule && spotsLeft !== null && (
        <div className="flex items-center gap-2 text-sm">
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                spotsLeft === 0
                  ? 'bg-red-500'
                  : spotsLeft <= 3
                    ? 'bg-orange-500'
                    : 'bg-green-500'
              )}
              style={{
                width: `${((selectedSchedule.capacity - spotsLeft) / selectedSchedule.capacity) * 100}%`,
              }}
            />
          </div>
          <span className="text-gray-500 text-xs whitespace-nowrap">
            {selectedSchedule.capacity - spotsLeft}/{selectedSchedule.capacity}名
          </span>
        </div>
      )}

      {/* Price */}
      <div className="flex items-center justify-between py-3 border-t border-gray-100">
        <span className="text-sm text-gray-600">受講料</span>
        <span className="text-xl font-bold text-gray-900">
          {formatCurrency(activity.price)}
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error.message}</span>
        </div>
      )}

      {/* Book Button */}
      <Button
        className="w-full"
        size="lg"
        onClick={handleBook}
        disabled={!selectedScheduleId || isPending || (spotsLeft !== null && spotsLeft <= 0)}
        isLoading={isPending}
      >
        {isPending ? '予約中...' : '予約する'}
      </Button>

      <p className="text-xs text-gray-400 text-center">
        ※ 支払いはアクティビティ参加後にご請求します
      </p>
    </div>
  )
}
