'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
// DISABLED: import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar } from '@/components/ui/avatar'
import { Star, MessageSquare, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react'
import type { Profile, Activity, InstructorFeedback } from '@/types/database'

interface StudentRecord {
  profile: Profile
  activity: Activity
  bookingId: string
}

interface FeedbackWithDetails extends InstructorFeedback {
  profiles: Profile | null
  activities: Activity | null
}

function StarRating({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="focus:outline-none"
          aria-label={`${star}星`}
        >
          <Star
            className={`h-6 w-6 transition-colors ${
              star <= (hover || value)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

function FeedbackForm({
  student,
  onSuccess,
}: {
  student: StudentRecord
  onSuccess: () => void
}) {
  const { user } = useAuthStore()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!user || rating === 0) {
      setError('評価を選択してください')
      return
    }
    setSubmitting(true)
    setError('')
    // DISABLED (Supabase): const supabase = createClient()
    // DISABLED (Supabase): const { error: err } = await supabase.from('instructor_feedback').insert({
      instructor_id: user.id,
      user_id: student.profile.id,
      activity_id: student.activity.id,
      rating,
      comment: comment.trim(),
    } as never)

    if (err) {
      setError(err.message)
    } else {
      onSuccess()
    }
    setSubmitting(false)
  }

  return (
    <div className="mt-3 space-y-4 pl-4 border-l-2 border-indigo-100">
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">評価</p>
        <StarRating value={rating} onChange={setRating} />
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        label="コメント（任意）"
        placeholder="生徒へのフィードバックを入力してください..."
        rows={3}
      />
      <div className="flex gap-2">
        <Button onClick={handleSubmit} isLoading={submitting} disabled={rating === 0}>
          送信する
        </Button>
      </div>
    </div>
  )
}

export default function InstructorFeedbackPage() {
  const { user } = useAuthStore()
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [recentFeedback, setRecentFeedback] = useState<FeedbackWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!user) return
    loadData()
  }, [user])

  async function loadData() {
    if (!user) return
    setLoading(true)
    // DISABLED (Supabase): const supabase = createClient()

    // Get recent bookings for this instructor's schedules
    // DISABLED (Supabase): const { data: bookings } = await supabase
      .from('bookings')
      .select('id, user_id, activity_schedules!inner(instructor_id, activity_id, activities(*))')
      .eq('activity_schedules.instructor_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(30)

    if (bookings) {
      // Get unique users
      const userIds = [...new Set(bookings.map((b: any) => b.user_id))]
      // DISABLED (Supabase): const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds)

      const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]))
      const seen = new Set<string>()
      const studentList: StudentRecord[] = []

      for (const b of bookings as any[]) {
        const key = `${b.user_id}-${b.activity_schedules?.activity_id}`
        if (seen.has(key)) continue
        seen.add(key)
        const profile = profileMap.get(b.user_id)
        const activity = b.activity_schedules?.activities
        if (profile && activity) {
          studentList.push({ profile, activity, bookingId: b.id })
        }
      }
      setStudents(studentList)
    }

    // Load recent feedback
    // DISABLED (Supabase): const { data: feedback } = await supabase
      .from('instructor_feedback')
      .select('*, profiles(*), activities(*)')
      .eq('instructor_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (feedback) {
      setRecentFeedback(feedback as unknown as FeedbackWithDetails[])
      const existingKeys = new Set(
        feedback.map((f: any) => `${f.user_id}-${f.activity_id}`)
      )
      setSubmitted(existingKeys)
    }

    setLoading(false)
  }

  function handleSuccess(key: string) {
    setSubmitted((prev) => new Set([...prev, key]))
    setExpandedId(null)
    // Reload feedback list
    if (user) {
      // DISABLED (Supabase): const supabase = createClient()
      // DISABLED (Supabase): supabase
        .from('instructor_feedback')
        .select('*, profiles(*), activities(*)')
        .eq('instructor_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)
        .then(({ data }) => {
          if (data) setRecentFeedback(data as unknown as FeedbackWithDetails[])
        })
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">フィードバック</h1>
        <p className="text-sm text-gray-500 mt-1">生徒へのフィードバックを送信します</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin h-6 w-6 rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Students list */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-indigo-600" />
                生徒リスト（{students.length}名）
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {students.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <MessageSquare className="h-10 w-10 mb-2 opacity-40" />
                  <p className="text-sm">フィードバックを送る生徒がいません</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {students.map((s) => {
                    const key = `${s.profile.id}-${s.activity.id}`
                    const alreadySubmitted = submitted.has(key)
                    const isExpanded = expandedId === key

                    return (
                      <div key={key} className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <Avatar
                            src={s.profile.avatar_url}
                            name={s.profile.name}
                            size="md"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {s.profile.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate mt-0.5">
                              {s.activity.title}
                            </p>
                          </div>
                          {alreadySubmitted ? (
                            <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                              <CheckCircle2 className="h-4 w-4" />
                              送信済み
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant={isExpanded ? 'secondary' : 'default'}
                              onClick={() => setExpandedId(isExpanded ? null : key)}
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="h-3.5 w-3.5 mr-1" />
                                  閉じる
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-3.5 w-3.5 mr-1" />
                                  フィードバック
                                </>
                              )}
                            </Button>
                          )}
                        </div>

                        {isExpanded && !alreadySubmitted && (
                          <FeedbackForm
                            student={s}
                            onSuccess={() => handleSuccess(key)}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent feedback submitted */}
          {recentFeedback.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="h-4 w-4 text-indigo-600" />
                  最近送信したフィードバック
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  {recentFeedback.map((fb) => (
                    <div key={fb.id} className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <Avatar
                          src={fb.profiles?.avatar_url}
                          name={fb.profiles?.name}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {fb.profiles?.name ?? '不明'}
                            </p>
                            <span className="text-xs text-gray-400 shrink-0">
                              {formatDate(fb.created_at)}
                            </span>
                          </div>
                          <p className="text-xs text-indigo-600 font-medium mt-0.5">
                            {fb.activities?.title}
                          </p>
                          <div className="flex items-center gap-1 mt-1.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-3.5 w-3.5 ${
                                  star <= fb.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                          {fb.comment && (
                            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                              {fb.comment}
                            </p>
                          )}
                        </div>
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
