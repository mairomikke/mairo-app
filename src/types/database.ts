// ============================================================
// DATABASE TYPES - matches Supabase schema exactly
// ============================================================

// ---- Enums ----

export type RoleType = 'general' | 'instructor' | 'organization_admin';

export type OrgMemberRole = 'admin' | 'instructor';

export type OrgMemberStatus = 'active' | 'pending';

export type ActivityStatus = 'draft' | 'published' | 'cancelled' | 'completed';

export type BookingStatus = 'reserved' | 'completed' | 'cancelled';

export type PaymentStatus = 'pending' | 'paid';

export type PaymentRecordStatus = 'pending' | 'requested' | 'completed';

export type NotificationType =
  | 'booking_confirmation'
  | 'reminder'
  | 'feedback_received'
  | 'payment_update'
  | 'message';

export type AIAnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type ReportStatus = 'pending' | 'generating' | 'completed' | 'failed';

// ---- Core Row Types ----

export interface Profile {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at?: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_type: RoleType;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  description: string | null;
  type: string;
  years_active: number;
  logo_url: string | null;
  created_by: string;
  created_at: string;
  updated_at?: string;
}

export interface OrganizationMember {
  id: string;
  user_id: string;
  organization_id: string;
  role: OrgMemberRole;
  status: OrgMemberStatus;
  created_at: string;
}

export interface Activity {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  category: string;
  price: number;
  capacity?: number;
  location: string | null;
  tags: string[];
  appeal_points: string[];
  status: ActivityStatus;
  image_url: string | null;
  created_at: string;
  updated_at?: string ;
}

export interface ActivitySchedule {
  id: string;
  activity_id: string;
  date_time: string;
  capacity?: number;
  instructor_id: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Booking {
  id: string;
  user_id: string;
  schedule_id: string;
  status: BookingStatus;
  payment_status: PaymentStatus;
  created_at: string;
  updated_at?: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  user_id: string;
  organization_id: string;
  amount: number;
  status: PaymentRecordStatus;
  created_at: string;
  updated_at?: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  activity_id: string;
  instructor_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface InstructorFeedback {
  id: string;
  instructor_id: string;
  user_id: string;
  activity_id: string;
  comment: string;
  rating: number;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  content: string;
  is_read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Reflection {
  id: string;
  user_id: string;
  activity_id: string;
  content: string;
  created_at: string;
  updated_at?: string;
}

export interface AIAnalysis {
  id: string;
  user_id: string;
  reflection_id: string | null;
  summary: string | null;
  insights: AIInsight[];
  status: AIAnalysisStatus;
  created_at: string;
  updated_at?: string;
}

export interface Report {
  id: string;
  user_id: string;
  file_url: string | null;
  report_type: string;
  status: ReportStatus;
  created_at: string;
}

export interface QRAuth {
  id: string;
  user_id: string;
  qr_data: string;
  created_at: string;
  updated_at?: string;
}

// ---- Nested / Enriched Types ----

export interface AIInsight {
  type: string;
  title: string;
  description: string;
  score?: number;
}

export interface MessageThread {
  partner: Profile;
  last_message: Message;
  unread_count: number;
  messages?: Message[];
}

// ---- Insert Types ----

export type ProfileInsert = Omit<Profile, 'created_at' | 'updated_at'>;
export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'email' | 'created_at' | 'updated_at'>>;

export type UserRoleInsert = Omit<UserRole, 'id' | 'created_at'>;

export type OrganizationInsert = Omit<Organization, 'id' | 'created_at' | 'updated_at'>;
export type OrganizationUpdate = Partial<Omit<Organization, 'id' | 'created_by' | 'created_at' | 'updated_at'>>;

export type OrganizationMemberInsert = Omit<OrganizationMember, 'id' | 'created_at'>;
export type OrganizationMemberUpdate = Partial<Pick<OrganizationMember, 'role' | 'status'>>;

export type ActivityInsert = Omit<Activity, 'id' | 'created_at' | 'updated_at'>;
export type ActivityUpdate = Partial<Omit<Activity, 'id' | 'organization_id' | 'created_at' | 'updated_at'>>;

export type ActivityScheduleInsert = Omit<ActivitySchedule, 'id' | 'created_at' | 'updated_at'>;
export type ActivityScheduleUpdate = Partial<Omit<ActivitySchedule, 'id' | 'activity_id' | 'created_at' | 'updated_at'>>;

export type BookingInsert = Omit<Booking, 'id' | 'created_at' | 'updated_at'>;
export type BookingUpdate = Partial<Pick<Booking, 'status' | 'payment_status'>>;

export type PaymentInsert = Omit<Payment, 'id' | 'created_at' | 'updated_at'>;
export type PaymentUpdate = Partial<Pick<Payment, 'status'>>;

export type MessageInsert = Omit<Message, 'id' | 'created_at'>;

export type ReviewInsert = Omit<Review, 'id' | 'created_at'>;
export type ReviewUpdate = Partial<Pick<Review, 'rating' | 'comment'>>;

export type InstructorFeedbackInsert = Omit<InstructorFeedback, 'id' | 'created_at'>;

export type NotificationInsert = Omit<Notification, 'id' | 'created_at'>;
export type NotificationUpdate = Partial<Pick<Notification, 'is_read'>>;

export type ReflectionInsert = Omit<Reflection, 'id' | 'created_at' | 'updated_at'>;
export type ReflectionUpdate = Partial<Pick<Reflection, 'content'>>;

export type AIAnalysisInsert = Omit<AIAnalysis, 'id' | 'created_at' | 'updated_at'>;
export type AIAnalysisUpdate = Partial<Pick<AIAnalysis, 'summary' | 'insights' | 'status'>>;

export type ReportInsert = Omit<Report, 'id' | 'created_at'>;
export type ReportUpdate = Partial<Pick<Report, 'file_url' | 'status'>>;

export type QRAuthInsert = Omit<QRAuth, 'id' | 'created_at' | 'updated_at'>;
export type QRAuthUpdate = Partial<Pick<QRAuth, 'qr_data'>>;

// ---- Joined / Extended Types ----

export interface ActivityWithOrganization extends Activity {
  organization: Organization;
}

export interface ActivityWithSchedules extends Activity {
  activity_schedules: ActivitySchedule[];
}

export interface ActivityFull extends Activity {
  organization: Organization;
  activity_schedules: ActivitySchedule[];
  reviews: Review[];
}

export interface BookingWithDetails extends Booking {
  activity_schedule: ActivitySchedule & {
    activity: Activity & {
      organization: Organization;
    };
  };
  user: Profile;
}

export interface BookingWithPayment extends Booking {
  payment: Payment | null;
}

export interface ReviewWithUser extends Review {
  user: Profile;
}

export interface OrganizationWithMembers extends Organization {
  organization_members: (OrganizationMember & { profile: Profile })[];
}

export interface OrganizationWithActivities extends Organization {
  activities: Activity[];
}

export interface InstructorFeedbackWithDetails extends InstructorFeedback {
  instructor: Profile;
  activity: Activity;
}

export interface ReflectionWithAnalysis extends Reflection {
  ai_analysis: AIAnalysis | null;
}

// ---- API Response Types ----

export interface ApiSuccess<T> {
  data: T;
  error: null;
}

export interface ApiError {
  data: null;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface ActivityFilters extends PaginationParams {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  tags?: string[];
  status?: ActivityStatus;
  organizationId?: string;
  search?: string;
}

// ---- Supabase Database Shape (generated-style) ----

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
        Relationships: [];
      };
      user_roles: {
        Row: UserRole;
        Insert: UserRoleInsert;
        Update: Partial<UserRoleInsert>;
        Relationships: [];
      };
      organizations: {
        Row: Organization;
        Insert: OrganizationInsert;
        Update: OrganizationUpdate;
        Relationships: [];
      };
      organization_members: {
        Row: OrganizationMember;
        Insert: OrganizationMemberInsert;
        Update: OrganizationMemberUpdate;
        Relationships: [];
      };
      activities: {
        Row: Activity;
        Insert: ActivityInsert;
        Update: ActivityUpdate;
        Relationships: [];
      };
      activity_schedules: {
        Row: ActivitySchedule;
        Insert: ActivityScheduleInsert;
        Update: ActivityScheduleUpdate;
        Relationships: [];
      };
      bookings: {
        Row: Booking;
        Insert: BookingInsert;
        Update: BookingUpdate;
        Relationships: [];
      };
      payments: {
        Row: Payment;
        Insert: PaymentInsert;
        Update: PaymentUpdate;
        Relationships: [];
      };
      messages: {
        Row: Message;
        Insert: MessageInsert;
        Update: Partial<MessageInsert>;
        Relationships: [];
      };
      reviews: {
        Row: Review;
        Insert: ReviewInsert;
        Update: ReviewUpdate;
        Relationships: [];
      };
      instructor_feedback: {
        Row: InstructorFeedback;
        Insert: InstructorFeedbackInsert;
        Update: Partial<InstructorFeedbackInsert>;
        Relationships: [];
      };
      notifications: {
        Row: Notification;
        Insert: NotificationInsert;
        Update: NotificationUpdate;
        Relationships: [];
      };
      reflections: {
        Row: Reflection;
        Insert: ReflectionInsert;
        Update: ReflectionUpdate;
        Relationships: [];
      };
      ai_analysis: {
        Row: AIAnalysis;
        Insert: AIAnalysisInsert;
        Update: AIAnalysisUpdate;
        Relationships: [];
      };
      reports: {
        Row: Report;
        Insert: ReportInsert;
        Update: ReportUpdate;
        Relationships: [];
      };
      qr_auth: {
        Row: QRAuth;
        Insert: QRAuthInsert;
        Update: QRAuthUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      role_type: RoleType;
      org_member_role: OrgMemberRole;
      org_member_status: OrgMemberStatus;
      activity_status: ActivityStatus;
      booking_status: BookingStatus;
      payment_status: PaymentStatus;
      payment_record_status: PaymentRecordStatus;
      notification_type: NotificationType;
      ai_analysis_status: AIAnalysisStatus;
      report_status: ReportStatus;
    };
  };
}
