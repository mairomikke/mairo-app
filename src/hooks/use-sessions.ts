'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { where, orderBy } from 'firebase/firestore'
import { auth } from '@/lib/firebase/client'
import { getMany, getOne, addOne, updateOne } from '@/lib/firebase/firestore'
import type {
  FbSession,
  FbSessionInsert,
  FbActivity,
  FbSessionWithActivity
} from '@/types/firebase'

export type Session = FbSession
export type SessionWithActivity = FbSessionWithActivity

const KEY = 'sessions'

// ── 公開セッション一覧 ────────────────────────────────────────────────────────
async function fetchSessions(filters: {
  organization_id?: string
  instructor_id?: string
  activity_id?: string
  limit?: number
} = {}): Promise<FbSessionWithActivity[]> {
  const constraints = [orderBy('date', 'asc')]

  if (filters.organization_id) {
    constraints.unshift(where('organization_id', '==', filters.organization_id))
  }
  if (filters.instructor_id) {
    constraints.unshift(where('instructor_id', '==', filters.instructor_id))
  }
  if (filters.activity_id) {
    constraints.unshift(where('activity_id', '==', filters.activity_id))
  }

  const sessions = await getMany<FbSession>('sessions', constraints)

  const activityCache = new Map<string, FbActivity | null>()

  return Promise.all(
    sessions.map(async (s) => {
      const activityId = s.activity_id

      if (!activityCache.has(activityId)) {
        const act = activityId
          ? await getOne<FbActivity>('activities', activityId)
          : null
        activityCache.set(activityId, act ?? null)
      }

      return {
        ...s,
        activity: activityCache.get(activityId) ?? null,
      }
    })
  )
}

// ── インストラクターの担当セッション ─────────────────────────────────────────
async function fetchInstructorSessions(): Promise<FbSessionWithActivity[]> {
  const uid = auth.currentUser?.uid
  if (!uid) return []
  return fetchSessions({ instructor_id: uid })
}

export function useSessions(filters?: Parameters<typeof fetchSessions>[0]) {
  return useQuery({
    queryKey: [KEY, 'list', filters ?? {}],
    queryFn: () => fetchSessions(filters ?? {}),
    staleTime: 60_000,
  })
}

export function useInstructorSessions() {
  return useQuery({
    queryKey: [KEY, 'instructor'],
    queryFn: fetchInstructorSessions,
    staleTime: 60_000,
  })
}

export function useSession(id: string) {
  return useQuery({
    queryKey: [KEY, 'detail', id],
    queryFn: async () => {
      const session = await getOne<FbSession>('sessions', id)
      if (!session) throw new Error('Session not found')

      const activity = session.activity_id
        ? await getOne<FbActivity>('activities', session.activity_id)
        : null

      return {
        ...session,
        activity: activity ?? null,
      }
    },
    enabled: !!id,
    staleTime: 60_000,
  })
}

export function useCreateSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: FbSessionInsert) => {
      const id = await addOne<FbSessionInsert>('sessions', input)
      return { id, ...input } as FbSession
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useUpdateSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<FbSession>
    }) => {
      await updateOne('sessions', id, updates)
      return { id, ...updates } as FbSession
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}