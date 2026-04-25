'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { GeneralDashboard } from '@/components/dashboard/general-dashboard'
import { InstructorDashboard } from '@/components/dashboard/instructor-dashboard'
import { OrgAdminDashboard } from '@/components/dashboard/org-admin-dashboard'

export default function DashboardPage() {
  const router = useRouter()
  const { user, roles, activeRole, isLoading } = useAuthStore()

  // ログイン済みでない場合はログインへ
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/auth/login')
    }
  }, [isLoading, user, router])

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  // activeRoleが設定済みならそれを使用、未設定なら最初のロール
  const resolvedRole: string = activeRole ?? (roles.length > 0 ? roles[0].role_type : 'general')

  return (
    <div className="p-4 lg:p-8">
      {resolvedRole === 'organization_admin' && (
        <OrgAdminDashboard userId={user.id} />
      )}
      {resolvedRole === 'instructor' && (
        <InstructorDashboard userId={user.id} />
      )}
      {resolvedRole !== 'organization_admin' && resolvedRole !== 'instructor' && (
        <GeneralDashboard userId={user.id} />
      )}
    </div>
  )
}
