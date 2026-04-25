import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FbUser } from '@/types/firebase'

// FbUser は Firestore の users コレクションから取得したプロフィール
// Profile 型との互換を保つため name / email / avatar_url / id を持つ
export type { FbUser as Profile }

interface AuthState {
  user: FbUser | null
  roles: { role_type: string }[]
  activeRole: string | null
  isLoading: boolean
  setUser: (user: FbUser | null) => void
  setRoles: (roles: { role_type: string }[]) => void
  setActiveRole: (role: string) => void
  setLoading: (loading: boolean) => void
  hasRole: (role: string) => boolean
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      roles: [],
      activeRole: null,
      isLoading: true,
      setUser: (user) => set({ user }),
      setRoles: (roles) => set({ roles }),
      setActiveRole: (activeRole) => set({ activeRole }),
      setLoading: (isLoading) => set({ isLoading }),
      hasRole: (role) => get().roles.some((r) => r.role_type === role),
      logout: () => set({ user: null, roles: [], activeRole: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ activeRole: state.activeRole }),
    }
  )
)
