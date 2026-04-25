'use client'

import Link from 'next/link'
import { MapPin, Star } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import type { FbActivity } from '@/types/firebase'

interface ActivityCardProps {
  activity: FbActivity
  organizationName?: string
  averageRating?: number
  reviewCount?: number
}

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

export function ActivityCard({
  activity,
  organizationName,
  averageRating,
  reviewCount = 0,
}: ActivityCardProps) {
  const categoryColor =
    CATEGORY_COLORS[activity.category] ?? 'bg-gray-100 text-gray-700'
  const gradient =
    CATEGORY_GRADIENTS[activity.category] ?? 'from-indigo-400 to-purple-600'

  const rating = averageRating ?? 0
  const fullStars = Math.floor(rating)
  const hasHalf = rating - fullStars >= 0.5

  return (
    <Link href={`/activities/${activity.id}`} className="group block h-full">
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden h-full flex flex-col">
        {/* Image / Gradient */}
        <div className="relative h-44 overflow-hidden shrink-0">
          {activity.image_url ? (
            <img
              src={activity.image_url}
              alt={activity.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div
              className={cn(
                'w-full h-full bg-gradient-to-br flex items-center justify-center',
                gradient
              )}
            >
              <span className="text-white text-5xl font-bold opacity-30">
                {activity.title.charAt(0)}
              </span>
            </div>
          )}
          {/* Category badge overlay */}
          <span
            className={cn(
              'absolute top-3 left-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
              categoryColor
            )}
          >
            {activity.category}
          </span>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1 gap-2">
          <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
            {activity.title}
          </h3>

          {organizationName && (
            <p className="text-xs text-gray-500 truncate">{organizationName}</p>
          )}

          {activity.location && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              <span className="truncate">{activity.location}</span>
            </div>
          )}

          {/* Rating */}
          {reviewCount > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'h-3.5 w-3.5',
                      i < fullStars
                        ? 'text-yellow-400 fill-yellow-400'
                        : i === fullStars && hasHalf
                          ? 'text-yellow-400 fill-yellow-200'
                          : 'text-gray-200 fill-gray-200'
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500">({reviewCount})</span>
            </div>
          )}

          <div className="flex items-center justify-between mt-auto pt-2">
            <p className="text-base font-bold text-indigo-600">
              {formatCurrency(activity.price)}
            </p>
            <button
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition-colors"
              onClick={(e) => {
                // Prevent double navigation — the Link handles it
                e.preventDefault()
                window.location.href = `/activities/${activity.id}`
              }}
            >
              予約する
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}
