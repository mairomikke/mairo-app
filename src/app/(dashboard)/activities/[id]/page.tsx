// DISABLED: import { createClient } from '@/lib/supabase/server'
// Supabase → Firebase 移行済み。このページは Firebase hooks に移行予定。
import { notFound } from 'next/navigation'
import { MapPin, Star, Users, Tag, Zap, Building2, Clock } from 'lucide-react'
import { BookingForm } from '@/components/activity/booking-form'
import { cn, formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import type { ActivityFull, ReviewWithUser, Profile, ActivitySchedule } from '@/types/database'

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

const CATEGORY_GRADIENTS: Record<string, string> = {
  sports: 'from-green-400 to-emerald-600',
  arts: 'from-purple-400 to-pink-600',
  music: 'from-pink-400 to-rose-600',
  academic: 'from-blue-400 to-indigo-600',
  technology: 'from-indigo-400 to-violet-600',
  outdoor: 'from-emerald-400 to-teal-600',
  cooking: 'from-orange-400 to-amber-600',
  language: 'from-yellow-400 to-orange-500',
}

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  const cls = size === 'md' ? 'h-5 w-5' : 'h-4 w-4'
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            cls,
            i < full
              ? 'text-yellow-400 fill-yellow-400'
              : i === full && half
                ? 'text-yellow-400 fill-yellow-200'
                : 'text-gray-200 fill-gray-200'
          )}
        />
      ))}
    </div>
  )
}

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // DISABLED (Supabase): const supabase = await createClient()
  // DISABLED (Supabase): const { data: activityData, error } = await supabase.from('activities')...
  // Firebase版は useActivity(id) hook（クライアントコンポーネント）で取得してください。

  // サーバーコンポーネントでのデータ取得は Firebase Admin SDK が必要なため、
  // 現在は空データで描画（クライアント側 hook に委任）
  const activity = null as unknown as ActivityFull & { reviews: ReviewWithUser[] }
  if (!activity) notFound()  // Firebase 移行完了まで notFound() で代替

  const schedules: ActivitySchedule[] = []
  const reviews: ReviewWithUser[] = []
  const instructors: Record<string, Profile> = {}
  const bookingCounts: Record<string, number> = {}

  // DISABLED (Supabase):
  // const instructorIds = [...new Set(schedules.map((s) => s.instructor_id).filter(Boolean))]
  // const { data: profilesData } = await supabase.from('profiles').select('*').in('id', instructorIds)
  // const { data: bookingDataRaw } = await supabase.from('bookings').select('schedule_id')...

  const avgRating = 0
  const gradient = 'from-indigo-400 to-purple-600'
  const categoryColor = 'bg-gray-100 text-gray-700'
  const now = new Date()
  const upcomingSchedules = schedules.filter((s) => new Date(s.date_time) > now)

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hero */}
      <div
        className={cn(
          'relative h-64 md:h-80 rounded-2xl overflow-hidden',
          !activity.image_url && `bg-gradient-to-br ${gradient}`
        )}
      >
        {activity.image_url ? (
          <img
            src={activity.image_url}
            alt={activity.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white text-8xl font-bold opacity-20">
              {activity.title.charAt(0)}
            </span>
          </div>
        )}
        {/* Category badge */}
        <span
          className={cn(
            'absolute top-4 left-4 inline-flex items-center rounded-full px-3 py-1 text-sm font-medium shadow',
            categoryColor
          )}
        >
          {activity.category}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Title & Meta */}
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-gray-900">{activity.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              {activity.organization && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  {activity.organization.name}
                </span>
              )}
              {activity.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  {activity.location}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-gray-400" />
                定員{activity.capacity}名
              </span>
            </div>
            {reviews.length > 0 && (
              <div className="flex items-center gap-2">
                <StarRating rating={avgRating} size="md" />
                <span className="text-sm font-semibold text-gray-700">
                  {avgRating.toFixed(1)}
                </span>
                <span className="text-sm text-gray-500">
                  ({reviews.length}件のレビュー)
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          {activity.description && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">説明</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                {activity.description}
              </p>
            </section>
          )}

          {/* Appeal Points */}
          {activity.appeal_points && activity.appeal_points.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">このアクティビティの魅力</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activity.appeal_points.map((point, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50 p-4"
                  >
                    <Zap className="h-5 w-5 text-indigo-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-gray-700">{point}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Tags */}
          {activity.tags && activity.tags.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">タグ</h2>
              <div className="flex flex-wrap gap-2">
                {activity.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
                  >
                    <Tag className="h-3 w-3" />
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Location Map Placeholder */}
          {activity.location && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">場所</h2>
              <div className="rounded-xl bg-gray-100 h-48 flex items-center justify-center border border-gray-200">
                <div className="text-center text-gray-500">
                  <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="font-medium">{activity.location}</p>
                  <p className="text-sm text-gray-400 mt-1">地図は近日公開予定</p>
                </div>
              </div>
            </section>
          )}

          {/* Instructor Info */}
          {Object.keys(instructors).length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">インストラクター</h2>
              <div className="space-y-3">
                {Object.values(instructors).map((instructor) => (
                  <div
                    key={instructor.id}
                    className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4"
                  >
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-lg shrink-0">
                      {instructor.avatar_url ? (
                        <img
                          src={instructor.avatar_url}
                          alt={instructor.name}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        instructor.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{instructor.name}</p>
                      {instructor.bio && (
                        <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">
                          {instructor.bio}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Reviews */}
          {reviews.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                レビュー ({reviews.length}件)
              </h2>
              <div className="space-y-4">
                {reviews.slice(0, 5).map((review) => (
                  <div
                    key={review.id}
                    className="rounded-xl border border-gray-200 bg-white p-5 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium shrink-0">
                          {review.user?.avatar_url ? (
                            <img
                              src={review.user.avatar_url}
                              alt={review.user.name}
                              className="h-full w-full rounded-full object-cover"
                            />
                          ) : (
                            (review.user?.name ?? '?').charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {review.user?.name ?? '匿名'}
                          </p>
                          <p className="text-xs text-gray-400">{formatDate(review.created_at)}</p>
                        </div>
                      </div>
                      <StarRating rating={review.rating} />
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {review.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Booking Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-gray-900">
                  {formatCurrency(activity.price)}
                </span>
                <span className="text-sm text-gray-500">/ 1回</span>
              </div>
              <BookingForm
                activity={activity}
                schedules={upcomingSchedules}
                bookingCounts={bookingCounts}
              />
            </div>

            {/* Organization Card */}
            {activity.organization && (
              <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-5 space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">主催者</h3>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold shrink-0">
                    {activity.organization.logo_url ? (
                      <img
                        src={activity.organization.logo_url}
                        alt={activity.organization.name}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      activity.organization.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      {activity.organization.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      活動歴 {activity.organization.years_active}年
                    </p>
                  </div>
                </div>
                {activity.organization.description && (
                  <p className="text-xs text-gray-500 line-clamp-3">
                    {activity.organization.description}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
