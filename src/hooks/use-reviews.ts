'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { where, orderBy } from 'firebase/firestore'
import { auth } from '@/lib/firebase/client'
import { getMany, addOne } from '@/lib/firebase/firestore'
import type { FbReview, FbReviewInsert, FbUser } from '@/types/firebase'

export type Review = FbReview
export type ReviewWithUser = FbReview & { user: Profile | null }

const KEY = 'reviews'

async function fetchReviewsForActivity(activityId: string): Promise<ReviewWithUser[]> {
  const reviews = await getMany<FbReview>('reviews', [
    where('activity_id', '==', activityId),
    orderBy('created_at', 'desc'),
  ])

  const userIds = [...new Set(reviews.map((r) => r.user_id))]
  const users = await Promise.all(
    userIds.map(async (uid) => {
      const users = await getMany<FbUser>('users', [where('id', '==', uid)])
      return users[0] ?? null
    })
  )
  const userMap = new Map(users.filter(Boolean).map((u) => [u!.id, u!]))

  return reviews.map((r) => ({ ...r, user: userMap.get(r.user_id) ?? null }))
}

async function fetchReviewsForInstructor(instructorId: string): Promise<ReviewWithUser[]> {
  const reviews = await getMany<FbReview>('reviews', [
    where('instructor_id', '==', instructorId),
    orderBy('created_at', 'desc'),
  ])
  return reviews.map((r) => ({ ...r, user: null }))
}

export function useActivityReviews(activityId: string) {
  return useQuery({
    queryKey: [KEY, 'activity', activityId],
    queryFn: () => fetchReviewsForActivity(activityId),
    enabled: !!activityId,
    staleTime: 60_000,
  })
}

export function useInstructorReviews(instructorId: string) {
  return useQuery({
    queryKey: [KEY, 'instructor', instructorId],
    queryFn: () => fetchReviewsForInstructor(instructorId),
    enabled: !!instructorId,
    staleTime: 60_000,
  })
}

export function useCreateReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: FbReviewInsert) => {
      const uid = auth.currentUser?.uid
      if (!uid) throw new Error('Not authenticated')
      const data: FbReviewInsert = { ...input, user_id: uid }
      const id = await addOne<FbReviewInsert>('reviews', data)
      return { id, ...data } as FbReview
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: [KEY, 'activity', data.activity_id] })
      if (data.instructor_id) {
        qc.invalidateQueries({ queryKey: [KEY, 'instructor', data.instructor_id] })
      }
    },
  })
}
