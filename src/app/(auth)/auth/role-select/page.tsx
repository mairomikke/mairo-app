'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Loader2, User, GraduationCap, Building2, Check, ArrowRight } from 'lucide-react'
// DISABLED: import { createClient } from '@/lib/supabase/client'
// Supabase → Firebase 移行済み。ロール保存は Firestore で行う。
import { auth } from '@/lib/firebase/client'
import { updateOne } from '@/lib/firebase/firestore'
import { cn } from '@/lib/utils'
import type { RoleType, UserRoleInsert } from '@/types/database'

const roleOptions: {
  value: RoleType
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  benefits: string[]
}[] = [
  {
    value: 'general',
    label: 'General User',
    description: 'Explore activities and track your personal growth journey',
    icon: User,
    benefits: ['Browse & book activities', 'Track reflections', 'Receive instructor feedback'],
  },
  {
    value: 'instructor',
    label: 'Instructor',
    description: 'Share your expertise by leading and managing activity sessions',
    icon: GraduationCap,
    benefits: ['Manage your schedule', 'Track attendance via QR', 'Provide participant feedback'],
  },
  {
    value: 'organization_admin',
    label: 'Organization Admin',
    description: 'Oversee activities, schedules, and bookings for your organization',
    icon: Building2,
    benefits: ['Manage activities & schedules', 'View bookings & analytics', 'Coordinate instructors'],
  },
]

export default function RoleSelectPage() {
  const router = useRouter()
  const [selectedRoles, setSelectedRoles] = useState<RoleType[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  function toggleRole(role: RoleType) {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    )
  }

  async function handleContinue() {
    if (selectedRoles.length === 0) {
      toast.error('Please select at least one role to continue.')
      return
    }

    setIsSubmitting(true)
    try {
      // DISABLED (Supabase): const supabase = createClient()
      // DISABLED (Supabase): const { data: { user } } = await supabase.auth.getUser()
      const user = auth.currentUser

      if (!user) {
        toast.error('You must be signed in to select roles.')
        router.push('/auth/login')
        return
      }

      // Firestore users コレクションの role フィールドを更新
      // 複数ロールは先頭を優先（Firebase版は role 単一フィールド）
      const primaryRole = selectedRoles.includes('organization_admin')
        ? 'org'
        : selectedRoles.includes('instructor')
          ? 'instructor'
          : 'user'

      await updateOne('users', user.uid, { role: primaryRole })

      // DISABLED (Supabase):
      // const { error } = await supabase.from('user_roles').upsert(inserts, ...)
      // if (error) throw error

      toast.success('Roles saved! Welcome to Mairo.')
      router.push('/dashboard')
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to save roles. Please try again.'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
      {/* Title */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Choose your roles</h2>
        <p className="text-slate-500 text-sm mt-1">
          Select all that apply — you can change this later
        </p>
      </div>

      {/* Role cards */}
      <div className="space-y-3 mb-6">
        {roleOptions.map((option) => {
          const Icon = option.icon
          const isSelected = selectedRoles.includes(option.value)

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggleRole(option.value)}
              className={cn(
                'w-full text-left flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-150',
                isSelected
                  ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              )}
              aria-pressed={isSelected}
            >
              {/* Icon */}
              <div
                className={cn(
                  'mt-0.5 h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                  isSelected ? 'bg-indigo-600' : 'bg-slate-100'
                )}
              >
                <Icon
                  className={cn('h-5 w-5', isSelected ? 'text-white' : 'text-slate-500')}
                />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'text-sm font-semibold',
                    isSelected ? 'text-indigo-700' : 'text-slate-800'
                  )}
                >
                  {option.label}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 mb-2">{option.description}</p>
                <ul className="space-y-0.5">
                  {option.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span
                        className={cn(
                          'h-1.5 w-1.5 rounded-full shrink-0',
                          isSelected ? 'bg-indigo-500' : 'bg-slate-300'
                        )}
                      />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Checkbox */}
              <div
                className={cn(
                  'mt-0.5 h-5 w-5 rounded flex items-center justify-center shrink-0 border-2 transition-all',
                  isSelected
                    ? 'border-indigo-600 bg-indigo-600'
                    : 'border-slate-300 bg-white'
                )}
              >
                {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
              </div>
            </button>
          )
        })}
      </div>

      {/* Selection summary */}
      {selectedRoles.length > 0 && (
        <p className="text-xs text-slate-500 text-center mb-4">
          {selectedRoles.length} role{selectedRoles.length > 1 ? 's' : ''} selected
        </p>
      )}

      {/* Continue button */}
      <button
        type="button"
        onClick={handleContinue}
        disabled={isSubmitting || selectedRoles.length === 0}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving…
          </>
        ) : (
          <>
            Continue to Dashboard
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>

      {/* Skip link */}
      <p className="mt-4 text-center">
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors underline underline-offset-2"
        >
          Skip for now
        </button>
      </p>
    </div>
  )
}
