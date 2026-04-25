'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { where } from 'firebase/firestore'
import { auth } from '@/lib/firebase/client'
import { getMany, addOne, updateOne } from '@/lib/firebase/firestore'
import type {
  FbAttendance,
  FbAttendanceInsert,
} from '@/types/firebase'
import type {
  BookingWithDetails,
  Profile,
} from '@/types/database'

export type Attendance = FbAttendance

export type AttendanceWithUser = FbAttendance & {
  user: Profile | null
  booking: BookingWithDetails | null
}

const KEY = 'attendance'

// ── セッション別出席一覧 ─────────────────────────────────────────────
async function fetchAttendanceForSession(sessionId: string): Promise<AttendanceWithUser[]> {
  const bookings = await getMany<BookingWithDetails>('bookings', [
    where('session_id', '==', sessionId),
  ])

  if (bookings.length === 0) return []

  const bookingIds = bookings.map((b) => b.id)
  const bookingMap = new Map(bookings.map((b) => [b.id, b]))

  const chunks: string[][] = []
  for (let i = 0; i < bookingIds.length; i += 30) {
    chunks.push(bookingIds.slice(i, i + 30))
  }

  const allAttendance: FbAttendance[] = []
  for (const chunk of chunks) {
    const att = await getMany<FbAttendance>('attendance', [
      where('booking_id', 'in', chunk),
    ])
    allAttendance.push(...att)
  }

  const userIds = [...new Set(bookings.map((b) => b.user_id))]
  const userChunks: string[][] = []
  for (let i = 0; i < userIds.length; i += 30) {
    userChunks.push(userIds.slice(i, i + 30))
  }

  const allUsers: Profile[] = []
  for (const chunk of userChunks) {
    const users = await getMany<Profile>('profiles', [
      where('id', 'in', chunk),
    ])
    allUsers.push(...users)
  }

  const userMap = new Map(allUsers.map((u) => [u.id, u]))

  return allAttendance.map((att) => {
    const booking = bookingMap.get(att.booking_id) ?? null
    const user = booking ? userMap.get(booking.user_id) ?? null : null

    return {
      ...att,
      booking,
      user,
    }
  })
}

export function useAttendance(sessionId: string) {
  return useQuery({
    queryKey: [KEY, 'session', sessionId],
    queryFn: () => fetchAttendanceForSession(sessionId),
    enabled: !!sessionId,
    staleTime: 30_000,
  })
}

export function useMarkAttendance() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (input: FbAttendanceInsert) => {
      const uid = auth.currentUser?.uid

      const id = await addOne<FbAttendanceInsert>('attendance', {
        ...input,
        verified_by: uid ?? null,
      })

      return { id, ...input } as FbAttendance
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useUpdateAttendance() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string
      status: FbAttendance['status']
    }) => {
      await updateOne('attendance', id, { status })
      return id
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}