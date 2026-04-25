-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS & ROLES
-- ============================================================

-- Profiles (standalone, no auth dependency)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User roles (multi-role support)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_type TEXT NOT NULL CHECK (role_type IN ('general', 'instructor', 'organization_admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role_type)
);

-- ============================================================
-- ORGANIZATIONS
-- ============================================================

CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  years_active INTEGER DEFAULT 0,
  logo_url TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'instructor')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

-- ============================================================
-- ACTIVITIES
-- ============================================================

CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  capacity INTEGER NOT NULL DEFAULT 10,
  location TEXT,
  tags TEXT[] DEFAULT '{}',
  appeal_points TEXT[] DEFAULT '{}' CHECK (array_length(appeal_points, 1) <= 3),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.activity_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  date_time TIMESTAMPTZ NOT NULL,
  capacity INTEGER NOT NULL,
  instructor_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BOOKINGS
-- ============================================================

CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  schedule_id UUID NOT NULL REFERENCES public.activity_schedules(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'completed', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, schedule_id)
);

-- Prevent overbooking via trigger
CREATE OR REPLACE FUNCTION check_booking_capacity()
RETURNS TRIGGER AS $$
DECLARE
  schedule_capacity INTEGER;
  current_bookings INTEGER;
BEGIN
  SELECT capacity INTO schedule_capacity
  FROM public.activity_schedules
  WHERE id = NEW.schedule_id;

  SELECT COUNT(*) INTO current_bookings
  FROM public.bookings
  WHERE schedule_id = NEW.schedule_id
    AND status != 'cancelled';

  IF current_bookings >= schedule_capacity THEN
    RAISE EXCEPTION 'Schedule is fully booked';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_booking_capacity
BEFORE INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION check_booking_capacity();

-- ============================================================
-- PAYMENTS
-- ============================================================

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'requested', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MESSAGING
-- ============================================================

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver ON public.messages(receiver_id);

-- ============================================================
-- REVIEWS
-- ============================================================

CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  instructor_id UUID REFERENCES public.profiles(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, activity_id)
);

-- ============================================================
-- INSTRUCTOR FEEDBACK
-- ============================================================

CREATE TABLE public.instructor_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instructor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('booking_confirmation', 'reminder', 'feedback_received', 'payment_update', 'message')),
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- REFLECTIONS
-- ============================================================

CREATE TABLE public.reflections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AI ANALYSIS
-- ============================================================

CREATE TABLE public.ai_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reflection_id UUID REFERENCES public.reflections(id),
  summary TEXT,
  insights JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- REPORTS
-- ============================================================

CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_url TEXT,
  report_type TEXT NOT NULL DEFAULT 'growth',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- QR AUTH
-- ============================================================

CREATE TABLE public.qr_auth (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  qr_data TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_activities_updated_at BEFORE UPDATE ON public.activities FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_activity_schedules_updated_at BEFORE UPDATE ON public.activity_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_reflections_updated_at BEFORE UPDATE ON public.reflections FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_ai_analysis_updated_at BEFORE UPDATE ON public.ai_analysis FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_qr_auth_updated_at BEFORE UPDATE ON public.qr_auth FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_auth ENABLE ROW LEVEL SECURITY;

-- Profiles: public read, own write
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- User roles: own read
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_roles_insert_own" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Organizations: public read, admin write
CREATE POLICY "organizations_select_all" ON public.organizations FOR SELECT USING (true);
CREATE POLICY "organizations_insert_auth" ON public.organizations FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "organizations_update_admin" ON public.organizations FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = id AND user_id = auth.uid() AND role = 'admin' AND status = 'active'
  )
);

-- Organization members: org admin manage
CREATE POLICY "org_members_select" ON public.organization_members FOR SELECT USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = organization_id AND om.user_id = auth.uid() AND om.role = 'admin' AND om.status = 'active'
  )
);
CREATE POLICY "org_members_insert_admin" ON public.organization_members FOR INSERT WITH CHECK (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = organization_id AND om.user_id = auth.uid() AND om.role = 'admin' AND om.status = 'active'
  )
);
CREATE POLICY "org_members_update_admin" ON public.organization_members FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = organization_id AND om.user_id = auth.uid() AND om.role = 'admin' AND om.status = 'active'
  )
);

-- Activities: public read, org admin write
CREATE POLICY "activities_select_published" ON public.activities FOR SELECT USING (
  status = 'published' OR
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = activities.organization_id AND user_id = auth.uid() AND status = 'active'
  )
);
CREATE POLICY "activities_insert_admin" ON public.activities FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = activities.organization_id AND user_id = auth.uid() AND role = 'admin' AND status = 'active'
  )
);
CREATE POLICY "activities_update_admin" ON public.activities FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = activities.organization_id AND user_id = auth.uid() AND role = 'admin' AND status = 'active'
  )
);

-- Activity schedules: public read
CREATE POLICY "schedules_select_all" ON public.activity_schedules FOR SELECT USING (true);
CREATE POLICY "schedules_insert_admin" ON public.activity_schedules FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.activities a
    JOIN public.organization_members om ON om.organization_id = a.organization_id
    WHERE a.id = activity_id AND om.user_id = auth.uid() AND om.role = 'admin' AND om.status = 'active'
  )
);
CREATE POLICY "schedules_update_admin" ON public.activity_schedules FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.activities a
    JOIN public.organization_members om ON om.organization_id = a.organization_id
    WHERE a.id = activity_id AND om.user_id = auth.uid() AND om.role = 'admin' AND om.status = 'active'
  )
);

-- Bookings: own read/write, org admin read
CREATE POLICY "bookings_select_own" ON public.bookings FOR SELECT USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.activity_schedules sch
    JOIN public.activities a ON a.id = sch.activity_id
    JOIN public.organization_members om ON om.organization_id = a.organization_id
    WHERE sch.id = schedule_id AND om.user_id = auth.uid() AND om.status = 'active'
  )
);
CREATE POLICY "bookings_insert_own" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bookings_update_own" ON public.bookings FOR UPDATE USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.activity_schedules sch
    JOIN public.activities a ON a.id = sch.activity_id
    JOIN public.organization_members om ON om.organization_id = a.organization_id
    WHERE sch.id = schedule_id AND om.user_id = auth.uid() AND om.status = 'active'
  )
);

-- Payments: own read
CREATE POLICY "payments_select_own" ON public.payments FOR SELECT USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = payments.organization_id AND user_id = auth.uid() AND status = 'active'
  )
);
CREATE POLICY "payments_insert_system" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "payments_update_admin" ON public.payments FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = payments.organization_id AND user_id = auth.uid() AND role = 'admin' AND status = 'active'
  )
);

-- Messages: own read/write
CREATE POLICY "messages_select_own" ON public.messages FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);
CREATE POLICY "messages_insert_own" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Reviews: own write, public read
CREATE POLICY "reviews_select_all" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert_own" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_update_own" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);

-- Instructor feedback: instructor write, subject read
CREATE POLICY "instructor_feedback_select" ON public.instructor_feedback FOR SELECT USING (
  auth.uid() = user_id OR auth.uid() = instructor_id
);
CREATE POLICY "instructor_feedback_insert" ON public.instructor_feedback FOR INSERT WITH CHECK (auth.uid() = instructor_id);

-- Notifications: own only
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert_system" ON public.notifications FOR INSERT WITH CHECK (true);

-- Reflections: own read/write
CREATE POLICY "reflections_select_own" ON public.reflections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "reflections_insert_own" ON public.reflections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reflections_update_own" ON public.reflections FOR UPDATE USING (auth.uid() = user_id);

-- AI Analysis: own read
CREATE POLICY "ai_analysis_select_own" ON public.ai_analysis FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ai_analysis_insert_system" ON public.ai_analysis FOR INSERT WITH CHECK (true);
CREATE POLICY "ai_analysis_update_system" ON public.ai_analysis FOR UPDATE USING (true);

-- Reports: own only
CREATE POLICY "reports_select_own" ON public.reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "reports_insert_own" ON public.reports FOR INSERT WITH CHECK (auth.uid() = user_id);

-- QR Auth: own only
CREATE POLICY "qr_auth_select_own" ON public.qr_auth FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "qr_auth_insert_own" ON public.qr_auth FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "qr_auth_update_own" ON public.qr_auth FOR UPDATE USING (auth.uid() = user_id);
-- Instructors can read any QR (for scanning)
CREATE POLICY "qr_auth_select_instructor" ON public.qr_auth FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role_type = 'instructor'
  )
);
