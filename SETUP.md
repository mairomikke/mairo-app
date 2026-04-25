# Mairo — Setup Guide

## 1. Supabase Project Setup

### Create Project
1. Go to [supabase.com](https://supabase.com) → New Project
2. Choose region closest to your users
3. Save your **Project URL**, **anon key**, and **service_role key**

### Configure Environment
```bash
cp .env.local.example .env.local
```
Fill in:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
ANTHROPIC_API_KEY=sk-ant-...   # optional for AI features
```

### Run Database Schema
In Supabase Dashboard → SQL Editor:
1. Paste the contents of `supabase/schema.sql` → Run
2. Paste the contents of `supabase/seed.sql` → Run (optional, for sample data)

### Configure Auth
- Dashboard → Authentication → URL Configuration
  - Site URL: `http://localhost:3000` (dev) / your production URL
  - Redirect URLs: `http://localhost:3000/**`

### Storage Buckets
In Supabase Dashboard → Storage → New Bucket:
- `avatars` — Public bucket (for user avatars)
- `activity-images` — Public bucket (for activity images)
- `reports` — Private bucket (for generated reports)

```sql
-- RLS for storage (run in SQL editor)
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('activity-images', 'activity-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('reports', 'reports', false);

CREATE POLICY "Avatar public read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Avatar own upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Activity images public read" ON storage.objects FOR SELECT USING (bucket_id = 'activity-images');
CREATE POLICY "Activity images org upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'activity-images' AND auth.role() = 'authenticated'
);

CREATE POLICY "Reports own read" ON storage.objects FOR SELECT USING (
  bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### Enable Realtime
Dashboard → Database → Replication → enable for:
- `messages`
- `notifications`

---

## 2. Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000

---

## 3. Project Structure

```
src/
├── app/
│   ├── (auth)/                     # Auth pages (login, register, role-select)
│   │   └── auth/
│   │       ├── login/
│   │       ├── register/
│   │       └── role-select/
│   ├── (dashboard)/                # Protected pages
│   │   ├── dashboard/              # Role-aware dashboard
│   │   ├── activities/             # Activity discovery + detail
│   │   ├── bookings/               # Booking management
│   │   ├── messages/               # Real-time messaging
│   │   ├── reflections/            # Reflection system
│   │   ├── profile/                # User profile + QR
│   │   ├── notifications/          # Notification center
│   │   ├── instructor/
│   │   │   ├── schedule/           # Instructor schedule
│   │   │   ├── attendance/         # QR attendance
│   │   │   └── feedback/           # Student feedback
│   │   └── organization/
│   │       ├── activities/         # Activity CRUD
│   │       ├── schedules/          # Schedule management
│   │       ├── bookings/           # Booking admin
│   │       └── analytics/          # Revenue & analytics
│   └── api/
│       ├── ai-analysis/            # AI analysis trigger
│       ├── notifications/send/     # Notification sender
│       └── reports/generate/       # PDF report generator
│
├── components/
│   ├── ui/                         # Reusable UI primitives
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── avatar.tsx
│   │   ├── modal.tsx
│   │   ├── select.tsx
│   │   ├── tabs.tsx
│   │   ├── skeleton.tsx
│   │   ├── textarea.tsx
│   │   ├── empty-state.tsx
│   │   └── loading.tsx
│   ├── layout/
│   │   ├── sidebar.tsx             # Main navigation
│   │   ├── header.tsx              # Mobile header
│   │   └── dashboard-layout.tsx    # Auth layout wrapper
│   ├── activity/
│   │   ├── activity-card.tsx       # Activity card component
│   │   └── booking-form.tsx        # Schedule selection + booking
│   ├── dashboard/
│   │   ├── general-dashboard.tsx   # Student/parent view
│   │   ├── instructor-dashboard.tsx
│   │   └── org-admin-dashboard.tsx
│   ├── organization/
│   │   └── activity-form.tsx       # Create/edit activity
│   ├── reflection/
│   │   └── reflection-modal.tsx    # Write reflection
│   ├── notifications/
│   │   └── notification-bell.tsx   # Bell + dropdown
│   └── providers/
│       ├── query-provider.tsx      # React Query
│       └── auth-provider.tsx       # Auth state sync
│
├── hooks/
│   ├── use-auth.ts                 # Auth actions
│   ├── use-activities.ts           # Activity queries
│   ├── use-bookings.ts             # Booking queries
│   ├── use-messages.ts             # Messaging + realtime
│   ├── use-notifications.ts        # Notifications + realtime
│   └── use-reflections.ts          # Reflection queries
│
├── stores/
│   ├── auth-store.ts               # Zustand auth state
│   └── notification-store.ts       # Zustand notification state
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser client
│   │   ├── server.ts               # Server client
│   │   └── middleware.ts           # Session refresh
│   ├── validations/
│   │   └── index.ts                # All Zod schemas
│   └── utils.ts                    # cn, formatCurrency, etc.
│
└── types/
    └── database.ts                 # All TypeScript types + DB shape

supabase/
├── schema.sql                      # Full DB schema + RLS
└── seed.sql                        # Sample data
```

---

## 4. Key Architecture Decisions

### Clean Architecture
- **Types layer**: `src/types/database.ts` — single source of truth for all entities
- **Data layer**: `src/hooks/` — all Supabase queries isolated in React Query hooks
- **State layer**: `src/stores/` — only transient UI state (auth session, notification count)
- **View layer**: `src/app/` + `src/components/` — pages and reusable UI

### Row-Level Security
All tables enforce RLS policies. Key patterns:
- Users can only read/write their own data
- Org admins can manage their organization's data
- Instructors can read schedules and submit feedback
- Published activities are publicly readable

### Real-time Features
- Messaging: Supabase Realtime channel on `messages` table
- Notifications: Realtime channel on `notifications` table
- Both channels filter by `user_id` for security

### QR Attendance Flow
1. User generates QR from `/profile` (contains `user_id`)
2. Instructor opens `/instructor/attendance`
3. Instructor scans/pastes QR data
4. System looks up `qr_auth` → finds `user_id` → checks booking for current schedule
5. Instructor confirms attendance → booking status → `completed`

### AI Analysis Flow
1. User submits reflection → `reflections` row created
2. `use-reflections.ts` calls `/api/ai-analysis` (POST)
3. API creates `ai_analysis` row (status: `pending`)
4. API simulates analysis (replace with Anthropic API call)
5. Updates row with `summary` + `insights` (status: `completed`)
6. Creates notification for user

---

## 5. Production Deployment

### Vercel
```bash
vercel --prod
```
Set environment variables in Vercel dashboard.

### Environment Variables Required
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `ANTHROPIC_API_KEY` (for real AI analysis)

---

## 6. Integrating Real AI Analysis

Replace the mock in `src/app/api/ai-analysis/route.ts`:

```typescript
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const message = await anthropic.messages.create({
  model: 'claude-opus-4-6',
  max_tokens: 1024,
  messages: [{
    role: 'user',
    content: `Analyze this reflection and provide growth insights in JSON:
    Activity: ${reflection.activities.title}
    Reflection: ${reflection.content}

    Return JSON: { summary: string, insights: [{ type: "strength"|"growth"|"pattern", text: string }] }`
  }]
})

const analysis = JSON.parse(message.content[0].text)
```

---

## 7. Adding PDF Reports

For actual PDF generation, add `@react-pdf/renderer`:
```bash
npm install @react-pdf/renderer
```

Then update `src/app/api/reports/generate/route.ts` to render a PDF component and upload to Supabase Storage.
