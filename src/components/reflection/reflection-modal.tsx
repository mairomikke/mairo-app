'use client'

import { useState, useEffect } from 'react'
import { Sparkles, BookOpen, AlertCircle } from 'lucide-react'
import { useCreateReflection } from '@/hooks/use-reflections'
import { useBookings } from '@/hooks/use-bookings'
import { useAuthStore } from '@/stores/auth-store'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { BookingWithDetails } from '@/types/database'

interface ReflectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultActivityId?: string
  onSuccess?: () => void
}

const MIN_LENGTH = 50
const MAX_LENGTH = 2000

export function ReflectionModal({
  open,
  onOpenChange,
  defaultActivityId,
  onSuccess,
}: ReflectionModalProps) {
  const user = useAuthStore((s) => s.user)
  const { data: bookings, isPending: bookingsPending } = useBookings()
  const { mutate: createReflection, isPending, error, isSuccess } = useCreateReflection()

  const [activityId, setActivityId] = useState(defaultActivityId ?? '')
  const [content, setContent] = useState('')

  useEffect(() => {
    if (defaultActivityId) setActivityId(defaultActivityId)
  }, [defaultActivityId])

  useEffect(() => {
    if (isSuccess) {
      setContent('')
      setActivityId(defaultActivityId ?? '')
      onSuccess?.()
      onOpenChange(false)
    }
  }, [isSuccess, defaultActivityId, onSuccess, onOpenChange])

  // Only show completed bookings
  const completedBookings = (bookings ?? []).filter((b) => b.status === 'completed') as BookingWithDetails[]

  // Dedupe by activity id
  const activityOptions: { id: string; title: string }[] = []
  const seen = new Set<string>()
  for (const b of completedBookings) {
    const actId = b.activity_schedule.activity.id
    if (!seen.has(actId)) {
      seen.add(actId)
      activityOptions.push({
        id: actId,
        title: b.activity_schedule.activity.title,
      })
    }
  }

  const charCount = content.length
  const isValid = activityId && charCount >= MIN_LENGTH

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || !user) return
    createReflection({
      user_id: user.id,
      activity_id: activityId,
      content,
    })
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="振り返りを書く"
      description="活動の感想や気づきを記録しましょう。AIがあなたの成長を分析します。"
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Activity Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            アクティビティ
            <span className="text-red-500 ml-1">*</span>
          </label>
          {bookingsPending ? (
            <div className="h-10 rounded-lg bg-gray-100 animate-pulse" />
          ) : activityOptions.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">
              完了したアクティビティがありません
            </div>
          ) : (
            <select
              value={activityId}
              onChange={(e) => setActivityId(e.target.value)}
              required
              className={cn(
                'flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-transparent',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              <option value="">アクティビティを選択...</option>
              {activityOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.title}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Content Textarea */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-gray-700">
              振り返りの内容
              <span className="text-red-500 ml-1">*</span>
            </label>
            <span
              className={cn(
                'text-xs',
                charCount > MAX_LENGTH
                  ? 'text-red-500'
                  : charCount < MIN_LENGTH
                    ? 'text-gray-400'
                    : 'text-green-600'
              )}
            >
              {charCount}/{MAX_LENGTH}
            </span>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="今日のアクティビティで何を学びましたか？どんな発見や気づきがありましたか？次回に活かしたいことは何ですか？自由に書いてみましょう..."
            rows={8}
            required
            minLength={MIN_LENGTH}
            maxLength={MAX_LENGTH}
            className={cn(
              'flex w-full rounded-lg border bg-white px-3 py-2 text-sm',
              'placeholder:text-gray-400',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-transparent',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'resize-y',
              charCount > MAX_LENGTH
                ? 'border-red-500 focus-visible:ring-red-500'
                : 'border-gray-300'
            )}
          />
          {charCount < MIN_LENGTH && charCount > 0 && (
            <p className="mt-1 text-xs text-gray-500">
              あと{MIN_LENGTH - charCount}文字以上入力してください
            </p>
          )}
        </div>

        {/* AI Analysis Notice */}
        <div className="flex items-start gap-3 rounded-xl bg-indigo-50 border border-indigo-100 p-4">
          <Sparkles className="h-5 w-5 text-indigo-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-indigo-800">
              AI分析が自動で生成されます
            </p>
            <p className="text-xs text-indigo-600 mt-0.5">
              送信後、AIがあなたの振り返りを分析し、成長のインサイトを提供します。
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error.message}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            キャンセル
          </Button>
          <Button
            type="submit"
            disabled={!isValid || isPending}
            isLoading={isPending}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            {isPending ? '保存中...' : '振り返りを保存'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
