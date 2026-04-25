'use client'

import { useCallback } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { auth } from '@/lib/firebase/client'
import { setOne } from '@/lib/firebase/firestore'
import { useAuthStore } from '@/stores/auth-store'
import type { FbUser } from '@/types/firebase'

export function useAuth() {
  const { user, roles, activeRole, isLoading, logout: storeLogout } = useAuthStore()

  const login = useCallback(async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    return cred
  }, [])

  const register = useCallback(async (email: string, password: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)

    // Firebase Auth のdisplayName を設定
    await updateProfile(cred.user, { displayName: name })

    // Firestore users コレクションにユーザー作成
    const newUser: Omit<FbUser, 'id'> = {
      role: 'user',
      email,
      name,
      avatar_url: null,
    }
    await setOne<Omit<FbUser, 'id'>>('users', cred.user.uid, newUser)

    return cred
  }, [])

  const logout = useCallback(async () => {
    await signOut(auth)
    storeLogout()
  }, [storeLogout])

  return {
    user,
    roles,
    activeRole,
    isLoading,
    login,
    register,
    logout,
  }
}
