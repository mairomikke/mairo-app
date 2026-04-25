'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { where, orderBy } from 'firebase/firestore'
import { auth } from '@/lib/firebase/client'
import { getMany, addOne, updateOne } from '@/lib/firebase/firestore'
import type { FbReflection, FbReflectionInsert } from '@/types/firebase'

// 既存UIとの型互換ブリッジ
export type Reflection = FbReflection & {
  activity_id: string
  updated_at: string
}
export type ReflectionWithAnalysis = Reflection & {
  ai_analysis: null   // Firebase版ではAI分析は別途実装
}
export type ReflectionInsert = FbReflectionInsert
export type ReflectionUpdate = Partial<Pick<FbReflection, 'content'>>

const KEY = 'reflections'

function toReflection(fb: FbReflection): ReflectionWithAnalysis {
  return {
    ...fb,
    activity_id: fb.session_id, // 既存UIのactivity_id互換
    updated_at: typeof fb.created_at === 'string' ? fb.created_at : new Date().toISOString(),
    ai_analysis: null,
  }
}

async function fetchReflections(): Promise<ReflectionWithAnalysis[]> {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Not authenticated')

  const items = await getMany<FbReflection>('reflections', [
    where('user_id', '==', uid),
    orderBy('created_at', 'desc'),
  ])

  return items.map(toReflection)
}

export function useReflections() {
  return useQuery({
    queryKey: [KEY],
    queryFn: fetchReflections,
    staleTime: 60_000,
  })
}

export function useCreateReflection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: FbReflectionInsert) => {
      const id = await addOne<FbReflectionInsert>('reflections', input)
      return toReflection({ id, ...input, created_at: new Date().toISOString() } as FbReflection)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useUpdateReflection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ReflectionUpdate }) => {
      await updateOne('reflections', id, updates)
      return { id, ...updates } as FbReflection
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}
