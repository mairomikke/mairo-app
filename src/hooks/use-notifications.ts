'use client'

import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { where, orderBy, limit } from 'firebase/firestore'
import { auth } from '@/lib/firebase/client'
import { getMany, updateOne, subscribeMany } from '@/lib/firebase/firestore'
import { useNotificationStore } from '@/stores/notification-store'
import type { FbNotification, FbPaginatedResponse, FbPaginationParams } from '@/types/firebase'

// 既存UIとの型互換ブリッジ
// Notification 型 → FbNotification に is_read / title / body を合わせる
export type Notification = {
  id: string
  user_id: string
  type: string
  title: string
  body: string | null
  is_read: boolean
  created_at: string
  metadata?: Record<string, unknown>
}

const KEY = 'notifications'

function toNotification(fb: FbNotification): Notification {
  return {
    id: fb.id,
    user_id: fb.user_id,
    type: fb.type,
    title: fb.title ?? '',
    body: fb.body ?? null,
    is_read: fb.read,
    created_at: typeof fb.created_at === 'string' ? fb.created_at : new Date().toISOString(),
  }
}

async function fetchNotifications(
  params: FbPaginationParams = {}
): Promise<FbPaginatedResponse<Notification>> {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Not authenticated')

  const pageSize = params.pageSize ?? 20

  const items = await getMany<FbNotification>('notifications', [
    where('user_id', '==', uid),
    orderBy('created_at', 'desc'),
    limit(pageSize),
  ])

  const converted = items.map(toNotification)
  const page = params.page ?? 1

  return {
    data: converted,
    count: converted.length,
    page,
    pageSize,
    totalPages: Math.ceil(converted.length / pageSize),
  }
}

async function fetchUnreadCount(): Promise<number> {
  const uid = auth.currentUser?.uid
  if (!uid) return 0

  const items = await getMany<FbNotification>('notifications', [
    where('user_id', '==', uid),
    where('read', '==', false),
  ])
  return items.length
}

export function useNotifications(params: FbPaginationParams = {}) {
  const { setNotifications, addNotifications } = useNotificationStore()

  return useQuery({
    queryKey: [KEY, 'list', params],
    queryFn: async () => {
      const result = await fetchNotifications(params)
      if ((params.page ?? 1) === 1) {
        // notification-store は既存型を期待 → as unknown で渡す
        setNotifications(result.data as unknown as Parameters<typeof setNotifications>[0])
      } else {
        addNotifications(result.data as unknown as Parameters<typeof addNotifications>[0])
      }
      return result
    },
    staleTime: 30_000,
  })
}

export function useUnreadCount() {
  const { setUnreadCount } = useNotificationStore()

  return useQuery({
    queryKey: [KEY, 'unread-count'],
    queryFn: async () => {
      const count = await fetchUnreadCount()
      setUnreadCount(count)
      return count
    },
    staleTime: 30_000,
  })
}

export function useMarkAsRead() {
  const qc = useQueryClient()
  const { markRead } = useNotificationStore()

  return useMutation({
    mutationFn: async (notificationId: string) => {
      await updateOne('notifications', notificationId, { read: true })
      return notificationId
    },
    onSuccess: (id) => {
      markRead(id)
      qc.invalidateQueries({ queryKey: [KEY, 'unread-count'] })
      qc.invalidateQueries({ queryKey: [KEY, 'list'] })
    },
  })
}

export function useMarkAllAsRead() {
  const qc = useQueryClient()
  const { markAllRead } = useNotificationStore()

  return useMutation({
    mutationFn: async () => {
      const uid = auth.currentUser?.uid
      if (!uid) throw new Error('Not authenticated')

      const unread = await getMany<FbNotification>('notifications', [
        where('user_id', '==', uid),
        where('read', '==', false),
      ])

      await Promise.all(unread.map((n) => updateOne('notifications', n.id, { read: true })))
    },
    onSuccess: () => {
      markAllRead()
      qc.invalidateQueries({ queryKey: [KEY] })
    },
  })
}

// ── Realtime: 通知の新着を監視 ────────────────────────────────────────────────
export function useRealtimeNotifications() {
  const qc = useQueryClient()
  const { prependNotification } = useNotificationStore()

  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) return

    const unsubscribe = subscribeMany<FbNotification>(
      'notifications',
      [where('user_id', '==', uid), orderBy('created_at', 'desc'), limit(1)],
      (items) => {
        if (items.length > 0) {
          prependNotification(toNotification(items[0]) as unknown as Parameters<typeof prependNotification>[0])
          qc.invalidateQueries({ queryKey: [KEY, 'unread-count'] })
        }
      }
    )

    return () => unsubscribe()
  }, [qc, prependNotification])
}
