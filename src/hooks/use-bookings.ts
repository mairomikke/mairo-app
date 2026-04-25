'use client'

import { useQuery } from '@tanstack/react-query'
import { db } from '@/lib/firebase'
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore'

import type { Profile } from '@/types/database'

function mapBooking(doc: any): Profile {
  const data = doc.data()
  return {
    id: doc.id,
    user_id: data.user_id ?? '',
    schedule_id: data.session_id ?? '',
    status: data.status ?? 'reserved',
    payment_status: data.payment_status ?? 'pending',
    created_at: data.created_at ?? '',
    updated_at: data.updated_at ?? '',

    activity_schedule: {
      id: data.session?.id ?? '',
      activity_id: data.session?.activity_id ?? '',
      date_time: data.session?.date ?? '',
      capacity: data.session?.capacity ?? 0,
      instructor_id: data.session?.instructor_id ?? null,
      created_at: data.session?.created_at ?? '',
      updated_at: data.session?.updated_at ?? '',

      activity: {
        id: data.activity?.id ?? '',
        organization_id: data.activity?.organization_id ?? '',
        title: data.activity?.title ?? '',
        description: data.activity?.description ?? null,
        category: data.activity?.category ?? '',
        price: data.activity?.price ?? 0,
        capacity: data.activity?.capacity ?? 0,
        location: data.activity?.location ?? null,
        tags: data.activity?.tags ?? [],
        appeal_points: data.activity?.appeal_points ?? [],
        status: data.activity?.status ?? 'published',
        image_url: data.activity?.image_url ?? null,
        created_at: data.activity?.created_at ?? '',
        updated_at: data.activity?.updated_at ?? '',

        organization: {
          id: data.activity?.organization?.id ?? '',
          name: data.activity?.organization?.name ?? '',
          description: null,
          type: '',
          years_active: 0,
          logo_url: null,
          created_by: '',
          created_at: '',
          updated_at: '',
        },
      },
    },

    import { toProfile } from '@/lib/firebase/mappers/profile'
    
    user: data.user ? toProfile(data.user) : null,
  }
}

export function useBookings(params?: {
  userId?: string
  status?: string
  pageSize?: number
}) {
  return useQuery({
    queryKey: ['bookings', params],
    queryFn: async () => {
      const ref = collection(db, 'bookings')

      let q = query(ref, orderBy('created_at', 'desc'))

      if (params?.userId) {
        q = query(q, where('user_id', '==', params.userId))
      }

      if (params?.status) {
        q = query(q, where('status', '==', params.status))
      }

      const snap = await getDocs(q)

      return snap.docs.map(mapBooking)
    },
  })
}