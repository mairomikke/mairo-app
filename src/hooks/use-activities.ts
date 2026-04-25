'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { where, orderBy, limit } from 'firebase/firestore'
import { getMany, getOne, addOne, updateOne } from '@/lib/firebase/firestore'
import type {
  FbActivity,
  FbActivityInsert,
  FbActivityFilters,
  FbSession,
} from '@/types/firebase'

// ── 既存 hooks との型互換ブリッジ ──────────────────────────────────────────
// 既存UIは Activity 型（Supabase版）を参照しているため、
// FbActivity を Activity と同じ shape で返せるようにする
export type Activity = FbActivity
export type ActivityWithSchedules = FbActivity & { activity_schedules: FbSession[] }
export type ActivityFilters = FbActivityFilters

const KEY = 'activities'

async function fetchActivities(
  filters: FbActivityFilters = {}
): Promise<Activity[]> {
  const constraints = []

  const status = filters.status ?? 'published'
  constraints.push(where('status', '==', status))

  if (filters.category) {
    constraints.push(where('category', '==', filters.category))
  }

  if (filters.organization_id) {
    constraints.push(where('organization_id', '==', filters.organization_id))
  }

  constraints.push(orderBy('created_at', 'desc'))

  const pageSize = filters.pageSize ?? 20
  constraints.push(limit(pageSize))

  const items = await getMany<FbActivity>('activities', constraints)

  // Firestore → UI型変換（ここが重要）
  const mapped = items.map(toActivity)

  // クライアントサイド検索
  if (filters.search) {
    const s = filters.search.toLowerCase()

    return mapped.filter(
      (a) =>
        a.title?.toLowerCase().toLowerCase().includes(s) ||
        a.description?.toLowerCase().toLowerCase().includes(s)
    )
  }

  return mapped
}

async function fetchActivity(id: string): Promise<FbActivity & { activity_schedules: FbSession[] }> {
  const activity = await getOne<FbActivity>('activities', id)
  if (!activity) throw new Error('Activity not found')

  // sessions をサブコレクションとして取得
  const sessions = await getMany<FbSession>('sessions', [
    where('activity_id', '==', id),
    orderBy('date', 'asc'),
  ])

  return { ...activity, activity_schedules: sessions }
}

export function useActivities(filters: FbActivityFilters = {}) {
  return useQuery({
    queryKey: [KEY, 'list', filters],
    queryFn: () => fetchActivities(filters),
    staleTime: 60_000,
  })
}

export function useActivity(id: string) {
  return useQuery({
    queryKey: [KEY, 'detail', id],
    queryFn: () => fetchActivity(id),
    enabled: !!id,
    staleTime: 60_000,
  })
}

export function useCreateActivity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: FbActivityInsert) => {
      const id = await addOne<FbActivityInsert>('activities', input)
      return { id, ...input } as FbActivity
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useUpdateActivity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<FbActivity> }) => {
      await updateOne('activities', id, updates)
      return { id, ...updates } as FbActivity
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: [KEY] })
      qc.invalidateQueries({ queryKey: [KEY, 'detail', data.id] })
    },
  })
}
