import { z } from 'zod';

// ============================================================
// AUTH SCHEMAS
// ============================================================

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be 100 characters or less'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password must be 72 characters or less')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    role: z.enum(['general', 'instructor', 'organization_admin']).default('general'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password must be 72 characters or less')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// ---- Auth Inferred Types ----
export type LoginInput = z.infer<typeof loginSchema>;
// Use z.input to get the form-input shape (role is optional due to .default)
export type RegisterInput = z.input<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ============================================================
// PROFILE SCHEMAS
// ============================================================

export const profileUpdateSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be 100 characters or less')
    .optional(),
  bio: z
    .string()
    .max(500, 'Bio must be 500 characters or less')
    .optional()
    .nullable(),
  avatar_url: z.string().url('Invalid URL').optional().nullable(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

// ============================================================
// ORGANIZATION SCHEMAS
// ============================================================

export const organizationCreateSchema = z.object({
  name: z
    .string()
    .min(1, 'Organization name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(200, 'Name must be 200 characters or less'),
  description: z
    .string()
    .max(1000, 'Description must be 1000 characters or less')
    .optional()
    .nullable(),
  type: z
    .string()
    .min(1, 'Organization type is required')
    .max(100, 'Type must be 100 characters or less'),
  years_active: z
    .number()
    .int('Must be a whole number')
    .min(0, 'Years active cannot be negative')
    .max(200, 'Years active seems too large')
    .default(0),
  logo_url: z.string().url('Invalid URL').optional().nullable(),
});

export const organizationUpdateSchema = organizationCreateSchema.partial();

export type OrganizationCreateInput = z.infer<typeof organizationCreateSchema>;
export type OrganizationUpdateInput = z.infer<typeof organizationUpdateSchema>;

export const organizationMemberInviteSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['admin', 'instructor']),
});

export type OrganizationMemberInviteInput = z.infer<typeof organizationMemberInviteSchema>;

// ============================================================
// ACTIVITY SCHEMAS
// ============================================================

export const ACTIVITY_CATEGORIES = [
  'sports',
  'arts',
  'music',
  'academic',
  'technology',
  'outdoor',
  'cooking',
  'language',
] as const;

export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number];

export const activityCreateSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be 200 characters or less'),
  description: z
    .string()
    .max(2000, 'Description must be 2000 characters or less')
    .optional()
    .nullable(),
  category: z.enum(ACTIVITY_CATEGORIES, { error: 'Please select a valid category' }),
  price: z
    .number()
    .min(0, 'Price cannot be negative')
    .max(1_000_000, 'Price seems too large'),
  capacity: z
    .number()
    .int('Capacity must be a whole number')
    .min(1, 'Capacity must be at least 1')
    .max(10_000, 'Capacity seems too large'),
  location: z
    .string()
    .max(300, 'Location must be 300 characters or less')
    .optional()
    .nullable(),
  tags: z
    .array(z.string().min(1).max(50))
    .max(20, 'Maximum 20 tags allowed')
    .default([]),
  appeal_points: z
    .array(z.string().min(1).max(200))
    .max(3, 'Maximum 3 appeal points allowed')
    .default([]),
  status: z
    .enum(['draft', 'published', 'cancelled', 'completed'])
    .default('draft'),
  image_url: z.string().url('Invalid URL').optional().nullable(),
});

export const activityUpdateSchema = activityCreateSchema.partial();

export type ActivityCreateInput = z.infer<typeof activityCreateSchema>;
export type ActivityUpdateInput = z.infer<typeof activityUpdateSchema>;

// ============================================================
// ACTIVITY SCHEDULE SCHEMAS
// ============================================================

export const activityScheduleCreateSchema = z.object({
  activity_id: z.string().uuid('Invalid activity ID'),
  date_time: z
    .string()
    .datetime({ message: 'Invalid date/time format' })
    .refine(
      (val) => new Date(val) > new Date(),
      'Schedule must be in the future'
    ),
  capacity: z
    .number()
    .int('Capacity must be a whole number')
    .min(1, 'Capacity must be at least 1')
    .max(10_000, 'Capacity seems too large'),
  instructor_id: z.string().uuid('Invalid instructor ID').optional().nullable(),
});

export const activityScheduleUpdateSchema = activityScheduleCreateSchema
  .omit({ activity_id: true })
  .partial();

export type ActivityScheduleCreateInput = z.infer<typeof activityScheduleCreateSchema>;
export type ActivityScheduleUpdateInput = z.infer<typeof activityScheduleUpdateSchema>;

// ============================================================
// BOOKING SCHEMAS
// ============================================================

export const bookingCreateSchema = z.object({
  schedule_id: z.string().uuid('Invalid schedule ID'),
});

export const bookingUpdateSchema = z.object({
  status: z.enum(['reserved', 'completed', 'cancelled']).optional(),
  payment_status: z.enum(['pending', 'paid']).optional(),
});

export type BookingCreateInput = z.infer<typeof bookingCreateSchema>;
export type BookingUpdateInput = z.infer<typeof bookingUpdateSchema>;

// ============================================================
// PAYMENT SCHEMAS
// ============================================================

export const paymentUpdateSchema = z.object({
  status: z.enum(['pending', 'requested', 'completed']),
});

export type PaymentUpdateInput = z.infer<typeof paymentUpdateSchema>;

// ============================================================
// MESSAGE SCHEMAS
// ============================================================

export const messageCreateSchema = z.object({
  receiver_id: z.string().uuid('Invalid receiver ID'),
  content: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(5000, 'Message must be 5000 characters or less'),
});

export type MessageCreateInput = z.infer<typeof messageCreateSchema>;

// ============================================================
// REVIEW SCHEMAS
// ============================================================

export const reviewCreateSchema = z.object({
  activity_id: z.string().uuid('Invalid activity ID'),
  instructor_id: z.string().uuid('Invalid instructor ID').optional().nullable(),
  rating: z
    .number()
    .int('Rating must be a whole number')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
  comment: z
    .string()
    .max(1000, 'Comment must be 1000 characters or less')
    .optional()
    .nullable(),
});

export const reviewUpdateSchema = reviewCreateSchema
  .pick({ rating: true, comment: true })
  .partial();

export type ReviewCreateInput = z.infer<typeof reviewCreateSchema>;
export type ReviewUpdateInput = z.infer<typeof reviewUpdateSchema>;

// ============================================================
// INSTRUCTOR FEEDBACK SCHEMAS
// ============================================================

export const instructorFeedbackCreateSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  activity_id: z.string().uuid('Invalid activity ID'),
  comment: z
    .string()
    .min(1, 'Feedback comment is required')
    .max(2000, 'Comment must be 2000 characters or less'),
  rating: z
    .number()
    .int('Rating must be a whole number')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
});

export type InstructorFeedbackCreateInput = z.infer<typeof instructorFeedbackCreateSchema>;

// ============================================================
// REFLECTION SCHEMAS
// ============================================================

export const reflectionCreateSchema = z.object({
  activity_id: z.string().uuid('Invalid activity ID'),
  content: z
    .string()
    .min(1, 'Reflection content is required')
    .min(10, 'Reflection must be at least 10 characters')
    .max(10_000, 'Reflection must be 10,000 characters or less'),
});

export const reflectionUpdateSchema = z.object({
  content: z
    .string()
    .min(10, 'Reflection must be at least 10 characters')
    .max(10_000, 'Reflection must be 10,000 characters or less'),
});

export type ReflectionCreateInput = z.infer<typeof reflectionCreateSchema>;
export type ReflectionUpdateInput = z.infer<typeof reflectionUpdateSchema>;

// ============================================================
// NOTIFICATION SCHEMAS
// ============================================================

export const notificationUpdateSchema = z.object({
  is_read: z.boolean(),
});

export type NotificationUpdateInput = z.infer<typeof notificationUpdateSchema>;

// ============================================================
// REPORT SCHEMAS
// ============================================================

export const reportCreateSchema = z.object({
  report_type: z.string().min(1).max(100).default('growth'),
});

export type ReportCreateInput = z.infer<typeof reportCreateSchema>;

// ============================================================
// QR AUTH SCHEMAS
// ============================================================

export const qrAuthCreateSchema = z.object({
  qr_data: z.string().min(1, 'QR data is required'),
});

export type QRAuthCreateInput = z.infer<typeof qrAuthCreateSchema>;

// ============================================================
// SEARCH / FILTER SCHEMAS
// ============================================================

export const activityFiltersSchema = z.object({
  category: z.enum(ACTIVITY_CATEGORIES).optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  location: z.string().max(300).optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().max(200).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export type ActivityFiltersInput = z.infer<typeof activityFiltersSchema>;

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
