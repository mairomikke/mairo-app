'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Loader2, UserPlus, User, GraduationCap, Building2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { registerSchema, type RegisterInput } from '@/lib/validations'
import { cn } from '@/lib/utils'

const roleOptions = [
  {
    value: 'general' as const,
    label: 'General User',
    description: 'Browse and book activities to grow your skills',
    icon: User,
    color: 'indigo',
  },
  {
    value: 'instructor' as const,
    label: 'Instructor',
    description: 'Teach and manage your activity sessions',
    icon: GraduationCap,
    color: 'emerald',
  },
  {
    value: 'organization_admin' as const,
    label: 'Organization Admin',
    description: 'Manage your organization and its activities',
    icon: Building2,
    color: 'violet',
  },
]

export default function RegisterPage() {
  const router = useRouter()
  const { register: registerUser } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'general',
    },
  })

  const selectedRole = watch('role')

  async function onSubmit(data: RegisterInput) {
    try {
      await registerUser(data.email, data.password, data.name)
      toast.success('Account created! Please select your roles.')
      router.push('/auth/role-select')
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to create account. Please try again.'
      toast.error(message)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
      {/* Title */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Create account</h2>
        <p className="text-slate-500 text-sm mt-1">Join Mairo to start your journey</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
            Full name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            {...register('name')}
            placeholder="Jane Doe"
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
            disabled={isSubmitting}
          />
          {errors.name && (
            <p className="mt-1.5 text-xs text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
            disabled={isSubmitting}
          />
          {errors.email && (
            <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              {...register('password')}
              placeholder="Min. 8 characters"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 pr-10 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Confirm password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              {...register('confirmPassword')}
              placeholder="Re-enter your password"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 pr-10 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1.5 text-xs text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Role selection */}
        <div>
          <p className="block text-sm font-medium text-slate-700 mb-2">
            I want to join as
          </p>
          <div className="space-y-2">
            {roleOptions.map((option) => {
              const Icon = option.icon
              const isSelected = selectedRole === option.value
              return (
                <label
                  key={option.value}
                  className={cn(
                    'flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-150',
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  )}
                >
                  <input
                    type="radio"
                    value={option.value}
                    checked={isSelected}
                    onChange={() => setValue('role', option.value, { shouldValidate: true })}
                    className="sr-only"
                  />
                  <div
                    className={cn(
                      'mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center shrink-0',
                      isSelected ? 'bg-indigo-600' : 'bg-slate-100'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4',
                        isSelected ? 'text-white' : 'text-slate-500'
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'text-sm font-semibold',
                        isSelected ? 'text-indigo-700' : 'text-slate-800'
                      )}
                    >
                      {option.label}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{option.description}</p>
                  </div>
                  <div
                    className={cn(
                      'mt-0.5 h-4 w-4 rounded-full border-2 shrink-0 transition-colors',
                      isSelected
                        ? 'border-indigo-600 bg-indigo-600'
                        : 'border-slate-300 bg-white'
                    )}
                  >
                    {isSelected && (
                      <div className="h-full w-full rounded-full flex items-center justify-center">
                        <div className="h-1.5 w-1.5 rounded-full bg-white" />
                      </div>
                    )}
                  </div>
                </label>
              )
            })}
          </div>
          {errors.role && (
            <p className="mt-1.5 text-xs text-red-600">{errors.role.message}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account…
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              Create account
            </>
          )}
        </button>
      </form>

      {/* Login link */}
      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link
          href="/auth/login"
          className="font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
