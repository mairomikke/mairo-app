'use client'

import { useAuthStore } from '@/stores/auth-store'
import { GeneralDashboard } from '@/components/dashboard/general-dashboard'
import { InstructorDashboard } from '@/components/dashboard/instructor-dashboard'
import { OrgAdminDashboard } from '@/components/dashboard/org-admin-dashboard'

export default function DashboardPage() {
  const { user, roles, activeRole } = useAuthStore()

  // activeRoleが設定済みならそれを使用、未設定なら最初のロール
  const resolvedRole: string = activeRole ?? (roles.length > 0 ? roles[0].role_type : 'general')

  if (!user) return null

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
