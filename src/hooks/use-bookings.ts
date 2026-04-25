'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { where, orderBy } from 'firebase/firestore'
import { auth } from '@/lib/firebase/client'
import { getMany, getOne, addOne, updateOne } from '@/lib/firebase/firestore'
import type {
  FbBooking,
  FbBookingInsert,
  FbSession,
  FbActivity,
  FbUser,
  FbBookingWithSession,
} from '@/types/firebase'

// 既存UIとの型互換ブリッジ
export type Booking = FbBooking

export type BookingWithDetails = FbBookingWithSession & {
  // 既存UIが参照するフィールドに合わせたシェイプ

  activity_schedule: FbSession & {
    id: string
    schedule_id: string
    date_time: string

    // 追加（Vercelエラー対応）
    updated_at: unknown

    activity: FbActivity & {
      organization: { id: string; name: string } | null
    }
  }

  user: FbUser

  payment_status: 'pending' | 'paid'

  // Firestore / UI互換のため追加（Vercelエラー対応）
  schedule_id: string
  updated_at: unknown
}

const KEY = 'bookings'

function toBookingWithDetails(
  booking: FbBooking,
  session: FbSession | null,
  activity: FbActivity | null,
  user: FbUser | null
): BookingWithDetails {
  const actWithOrg = activity
    ? { ...activity, organization: { id: activity.organization_id, name: '' } }
    : null

  return {
    ...booking,
    session,
    activity,
    payment_status: booking.status === 'completed' ? 'paid' : 'pending',
    activity_schedule: {
      ...(session ?? ({} as FbSession)),
      date_time: session?.date ?? '',
      activity: actWithOrg ?? ({} as FbActivity & { organization: null }),
    },
    user: user ?? ({} as FbUser),
  }
}

async function fetchUserBookings(): Promise<BookingWithDetails[]> {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Not authenticated')

  const bookings = await getMany<FbBooking>('bookings', [
    where('user_id', '==', uid),
    orderBy('created_at', 'desc'),
  ])

  // 各 booking の session / activity / user を並列取得
  return Promise.all(
    bookings.map(async (b) => {
      const [session, user] = await Promise.all([
        getOne<FbSession>('sessions', b.session_id),
        getOne<FbUser>('users', b.user_id),
      ])
      const activity = session ? await getOne<FbActivity>('activities', session.activity_id) : null
      return toBookingWithDetails(b, session, activity, user)
    })
  )
}

async function fetchOrganizationBookings(orgId: string): Promise<BookingWithDetails[]> {
  if (!orgId) return []

  // org の sessions を先に取得
  const sessions = await getMany<FbSession>('sessions', [
    where('organization_id', '==', orgId),
  ])
  const sessionIds = sessions.map((s) => s.id)

  if (sessionIds.length === 0) return []

  // sessions に紐づく bookings (Firestoreのin制限: 30件)
  const chunks: string[][] = []
  for (let i = 0; i < sessionIds.length; i += 30) {
    chunks.push(sessionIds.slice(i, i + 30))
  }

  const allBookings: FbBooking[] = []
  for (const chunk of chunks) {
    const bs = await getMany<FbBooking>('bookings', [
      where('session_id', 'in', chunk),
      orderBy('created_at', 'desc'),
    ])
    allBookings.push(...bs)
  }

  const sessionMap = new Map(sessions.map((s) => [s.id, s]))

  return Promise.all(
    allBookings.map(async (b) => {
      const session = sessionMap.get(b.session_id) ?? null
      const [activity, user] = await Promise.all([
        session ? getOne<FbActivity>('activities', session.activity_id) : Promise.resolve(null),
        getOne<FbUser>('users', b.user_id),
      ])
      return toBookingWithDetails(b, session, activity, user)
    })
  )
}

export function useBookings() {
  return useQuery({
    queryKey: [KEY, 'user'],
    queryFn: fetchUserBookings,
    staleTime: 60_000,
  })
}

export function useOrganizationBookings(orgId: string) {
  return useQuery({
    queryKey: [KEY, 'organization', orgId],
    queryFn: () => fetchOrganizationBookings(orgId),
    enabled: !!orgId,
    staleTime: 60_000,
  })
}

export function useCreateBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: FbBookingInsert) => {
      const id = await addOne<FbBookingInsert>('bookings', input)
      return { id, ...input } as FbBooking
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useCancelBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (bookingId: string) => {
      await updateOne('bookings', bookingId, { status: 'cancelled' })
      return bookingId
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}
