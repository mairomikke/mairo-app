'use client'

import { useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase/client'
import { getOne } from '@/lib/firebase/firestore'
import { useAuthStore } from '@/stores/auth-store'
import type { Profile } from '@/types/database'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setRoles, setLoading, logout } = useAuthStore()

  useEffect(() => {
    // Firebase Auth の状態変化を監視
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true)
      try {
        if (!firebaseUser) {
          logout()
          return
        }

        // Firestore の users コレクションからプロフィール取得
        const profile = await getOne<FbUser>('users', firebaseUser.uid)

        if (!profile) {
          // 新規ユーザー: Firebase Auth の情報だけで仮プロフィールを作成
          const fallback: FbUser = {
            id: firebaseUser.uid,
            role: 'user',
            email: firebaseUser.email ?? '',
            name: firebaseUser.displayName ?? firebaseUser.email ?? 'ユーザー',
            avatar_url: firebaseUser.photoURL ?? null,
          }
          setUser(fallback)
          setRoles([{ role_type: 'general' }])
          return
        }

        setUser(profile)

        // role → roles 配列に変換（既存UIの useAuthStore.roles と互換）
        const roleMap: Record<FbUser['role'], string> = {
          user: 'general',
          instructor: 'instructor',
          org: 'organization_admin',
        }
        setRoles([{ role_type: roleMap[profile.role] ?? 'general' }])
      } catch (err) {
        console.error('Auth initialization error:', err)
        logout()
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [setUser, setRoles, setLoading, logout])

  return <>{children}</>
}
