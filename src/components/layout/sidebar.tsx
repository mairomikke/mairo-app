'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import { useAuth } from '@/hooks/use-auth'
import { useUnreadCount } from '@/hooks/use-notifications'
import { Avatar } from '@/components/ui/avatar'
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  MessageSquare,
  User,
  BarChart3,
  QrCode,
  ClipboardList,
  LogOut,
  X,
  Activity,
  ChevronDown,
  Check,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Nav items per role
// ---------------------------------------------------------------------------
const navItems = {
  general: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/activities', label: 'Activities', icon: Activity },
    { href: '/bookings', label: 'My Bookings', icon: CalendarDays },
    { href: '/reflections', label: 'Reflections', icon: BookOpen },
    { href: '/messages', label: 'Messages', icon: MessageSquare },
    { href: '/profile', label: 'Profile', icon: User },
  ],
  instructor: [
    { href: '/dashboard', label: 'Main Page', icon: LayoutDashboard },
    { href: '/instructor/notifications', label: '通知一覧', icon: MessageSquare },
    { href: '/instructor/calendar', label: 'カレンダー', icon: CalendarDays },
    { href: '/instructor/profile', label: 'Profile', icon: User },
  ],
  organization_admin: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/organization/activities', label: 'Activities', icon: Activity },
    { href: '/organization/schedules', label: 'Schedules', icon: CalendarDays },
    { href: '/organization/bookings', label: 'Bookings', icon: BookOpen },
    { href: '/organization/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/organization/messages', label: 'Messages', icon: MessageSquare },
    { href: '/organization/profile', label: 'Profile', icon: User },
  ],
} as const

type RoleKey = keyof typeof navItems

const roleLabels: Record<RoleKey, string> = {
  general: 'General User',
  instructor: 'Instructor',
  organization_admin: 'Org Admin',
}

// ---------------------------------------------------------------------------
// Component Props
// ---------------------------------------------------------------------------
interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

// ---------------------------------------------------------------------------
// Sidebar Component
// ---------------------------------------------------------------------------
export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, roles, activeRole, setActiveRole } = useAuthStore()
  const { logout } = useAuth()
  const { data: unreadCount = 0 } = useUnreadCount()
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Determine which role to display
  const currentRole: RoleKey =
    (activeRole as RoleKey) ??
    (roles.length > 0 ? (roles[0].role_type as RoleKey) : 'general')

  const currentNavItems = navItems[currentRole] ?? navItems.general

  // Available roles from user's assigned roles
  const availableRoles = roles.map((r) => r.role_type as RoleKey)

  // Close role dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setRoleDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close sidebar on route change (mobile)
  useEffect(() => {
    onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  async function handleLogout() {
    await logout()
    router.push('/auth/login')
  }

  function handleRoleSwitch(role: RoleKey) {
    setActiveRole(role)
    setRoleDropdownOpen(false)
    router.push('/dashboard')
  }

  const sidebarContent = (
    <div className="flex h-full flex-col bg-white border-r border-slate-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-slate-100">
        <Link href="/dashboard" className="flex items-center gap-2 group" onClick={onClose}>
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm group-hover:bg-indigo-700 transition-colors">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <span className="text-xl font-bold text-indigo-600 tracking-tight">Mairo</span>
        </Link>
        {/* Close button - mobile only */}
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Role Switcher */}
      {availableRoles.length > 1 && (
        <div className="px-3 pt-3 pb-1" ref={dropdownRef}>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider px-2 mb-1.5">
            Role
          </p>
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen((v) => !v)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 text-sm font-medium hover:bg-indigo-100 transition-colors"
              aria-expanded={roleDropdownOpen}
            >
              <span>{roleLabels[currentRole]}</span>
              <ChevronDown
                className={cn('h-4 w-4 transition-transform', roleDropdownOpen && 'rotate-180')}
              />
            </button>
            {roleDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                {availableRoles.map((role) => (
                  <button
                    key={role}
                    onClick={() => handleRoleSwitch(role)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <span>{roleLabels[role]}</span>
                    {role === currentRole && (
                      <Check className="h-4 w-4 text-indigo-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider px-2 mb-2">
          Navigation
        </p>
        {currentNavItems.map((item) => {
          const Icon = item.icon
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)
          const isMessages = item.href === '/messages'

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4 shrink-0',
                  isActive ? 'text-white' : 'text-slate-400'
                )}
              />
              <span className="flex-1">{item.label}</span>
              {isMessages && unreadCount > 0 && (
                <span
                  className={cn(
                    'inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-xs font-semibold',
                    isActive
                      ? 'bg-white text-indigo-600'
                      : 'bg-indigo-600 text-white'
                  )}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-slate-100 p-3 space-y-1">
        {user && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-50">
            <Avatar src={user.avatar_url} name={user.name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
        )}

        {/* Role Switcher */}
        <div className="pt-1 pb-0.5">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider px-3 mb-1">
            ロール切替
          </p>
          {(
            [
              { role: 'general' as RoleKey, label: roleLabels.general },
              { role: 'instructor' as RoleKey, label: roleLabels.instructor },
              { role: 'organization_admin' as RoleKey, label: roleLabels.organization_admin },
            ] as const
          ).map(({ role, label }) => {
            const isActive = currentRole === role
            return (
              <button
                key={role}
                onClick={() => handleRoleSwitch(role)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                <span>{label}</span>
                {isActive && <Check className="h-3.5 w-3.5 text-indigo-600" />}
              </button>
            )
          })}
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all duration-150 group"
        >
          <LogOut className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-red-500 transition-colors" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Sidebar navigation"
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:w-64"
        aria-label="Sidebar navigation"
      >
        {sidebarContent}
      </aside>
    </>
  )
}
