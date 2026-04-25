import { NextRequest, NextResponse } from 'next/server'
// DISABLED: import { createClient } from '@/lib/supabase/server'
import type { NotificationType } from '@/types/database'

interface SendNotificationPayload {
  userId: string
  type: NotificationType
  content: string
  metadata?: Record<string, unknown>
  sendEmail?: boolean
}

export async function POST(request: NextRequest) {
  // DISABLED (Supabase): const supabase = await createClient()

  // Verify authentication
  const {
    data: { user },
  // DISABLED (Supabase): } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: SendNotificationPayload = await request.json()

  const { userId, type, content, metadata = {}, sendEmail = false } = body

  if (!userId || !type || !content) {
    return NextResponse.json(
      { error: 'userId, type, and content are required' },
      { status: 400 }
    )
  }

  const validTypes: NotificationType[] = [
    'booking_confirmation',
    'reminder',
    'feedback_received',
    'payment_update',
    'message',
  ]

  if (!validTypes.includes(type)) {
    return NextResponse.json(
      { error: `Invalid notification type. Must be one of: ${validTypes.join(', ')}` },
      { status: 400 }
    )
  }

  // Insert notification into the database
  // DISABLED (Supabase): const { data: notification, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      content,
      is_read: false,
      metadata,
    } as never)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // In production: send email via email service (e.g., Resend, SendGrid)
  if (sendEmail) {
    // Fetch user profile to get email address
    // DISABLED (Supabase): const { data: profile } = await supabase
      .from('profiles')
      .select('email, name')
      .eq('id', userId)
      .single()

    if (profile) {
      const p = profile as unknown as { email: string; name: string }
      // TODO: integrate email provider (e.g., Resend, SendGrid)
      console.log(`[Email stub] Would send to ${p.email}: ${content}`)
    }
  }

  return NextResponse.json({ success: true, notification })
}
