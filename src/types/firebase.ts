// ============================================================
// FIREBASE TYPES - Firestore コレクション設計に対応
// ============================================================

// ---- Firestore Document Types ----------------------------------------

export interface FbUser {
  id: string
  role: 'user' | 'instructor' | 'org'
  email: string
  name: string
  avatar_url: string | null
}

export interface FbOrganizationMember {
  id: string
  organization_id: string
  user_id: string
  role: 'admin' | 'staff' | 'instructor'
}

export interface FbActivity {
  id: string
  title: string
  organization_id: string
  is_official: boolean
  created_by: string
  description?: string
  category?: string
  price?: number
  capacity?: number
  location?: string
  tags?: string[]
  appeal_points?: string[]
  status?: 'draft' | 'published' | 'cancelled' | 'completed'
  image_url?: string
  created_at?: string
  updated_at?: string
}

export interface FbSession {
  id: string
  activity_id: string
  title: string
  date: string                    // ISO string
  location: string
  instructor_id: string | null
  organization_id: string
  is_external: boolean
  created_by: string
  verification_level: 'none' | 'instructor' | 'org'
  capacity?: number
  created_at?: string
}

export interface FbBooking {
  id: string
  user_id: string
  session_id: string
  status: 'reserved' | 'completed' | 'cancelled'
  source: 'app' | 'manual'
  created_at?: string
}

export interface FbAttendance {
  id: string
  booking_id: string
  status: 'present' | 'absent' | 'late'
  verified_by: string | null
  created_at?: string
}

export interface FbReflection {
  id: string
  user_id: string
  session_id: string
  content: string
  created_at?: string
}

export interface FbFeedback {
  id: string
  session_id: string
  reflection_id: string | null
  instructor_id: string
  content: string
  rating?: number
  created_at?: string
}

export interface FbConversation {
  id: string
  participant_ids: string[]
  type: 'direct' | 'group' | 'org'
  created_at?: string
}

export interface FbMessage {
  id: string
  conversation_id: string
  sender_id: string
  receiver_ids: string[]
  type: 'text' | 'image' | 'system'
  content: string
  is_read?: boolean
  created_at: string
}

export interface FbNotification {
  id: string
  user_id: string
  type: string
  title?: string
  body?: string
  read: boolean
  created_at: string
}

export interface FbReview {
  id: string
  user_id: string
  activity_id: string
  session_id: string | null
  instructor_id: string | null
  rating: number
  comment: string | null
  created_at?: string
}

export interface FbProfilePrivate {
  user_id: string
  extra_data: Record<string, unknown>
}

export interface FbProfilePublic {
  user_id: string
  bio: string | null
  visible_fields: string[]
  name?: string
  avatar_url?: string | null
}

export interface FbParticipationSummary {
  user_id: string
  total_sessions: number
  by_category: Record<string, number>
  last_updated: string
}

// ---- Insert helpers (omit auto-fields) --------------------------------

export type FbActivityInsert = Omit<FbActivity, 'id' | 'created_at'>
export type FbSessionInsert = Omit<FbSession, 'id' | 'created_at'>
export type FbBookingInsert = Omit<FbBooking, 'id' | 'created_at'>
export type FbAttendanceInsert = Omit<FbAttendance, 'id' | 'created_at'>
export type FbReflectionInsert = Omit<FbReflection, 'id' | 'created_at'>
export type FbFeedbackInsert = Omit<FbFeedback, 'id' | 'created_at'>
export type FbMessageInsert = Omit<FbMessage, 'id'>
export type FbNotificationInsert = Omit<FbNotification, 'id'>
export type FbReviewInsert = Omit<FbReview, 'id' | 'created_at'>

// ---- Joined / enriched types ------------------------------------------

export interface FbSessionWithActivity extends FbSession {
  activity: FbActivity | null
}

export interface FbBookingWithSession extends FbBooking {
  session: FbSession | null
  activity: FbActivity | null
}

export interface FbMessageThread {
  conversation: FbConversation
  partner: FbUser | null
  last_message: FbMessage | null
  unread_count: number
}

// ---- Pagination -------------------------------------------------------

export interface FbPaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}

export interface FbPaginationParams {
  page?: number
  pageSize?: number
}

export interface FbActivityFilters extends FbPaginationParams {
  category?: string
  organization_id?: string
  status?: FbActivity['status']
  search?: string
  minPrice?: number
  maxPrice?: number
  location?: string
  tags?: string[]
}
