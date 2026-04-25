import { NextRequest, NextResponse } from 'next/server'
import type { NotificationType } from '@/types/database'

interface SendNotificationPayload {
  userId: string
  type: NotificationType
  content: string
  metadata?: Record<string, unknown>
  sendEmail?: boolean
}

export async function POST(request: NextRequest) {
  const body: SendNotificationPayload = await request.json()

  const { userId, type, content, metadata = {}, sendEmail = false } = body


  const user = { id: userId }

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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

  const notification = {
    user_id: userId,
    type,
    content,
    is_read: false,
    metadata,
  }

  // In production: send email via email service (e.g., Resend, SendGrid)
  if (sendEmail) {
    const profile = {
      email: 'test@example.com',
      name: 'User',
    }

    const p = profile as { email: string; name: string }
    console.log(`[Email stub] Would send to ${p.email}: ${content}`)
  }

  return NextResponse.json({ success: true, notification })
}