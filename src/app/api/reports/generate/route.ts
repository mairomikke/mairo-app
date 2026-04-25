import { NextRequest, NextResponse } from 'next/server'
// DISABLED: import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const { reportId, userId, reportType = 'full' } = await request.json()

  if (!reportId || !userId) {
    return NextResponse.json(
      { error: 'reportId and userId are required' },
      { status: 400 }
    )
  }

  // DISABLED (Supabase): const supabase = await createClient()
  const {
    data: { user },
  // DISABLED (Supabase): } = await supabase.auth.getUser()

  if (!user || user.id !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Mark as generating
  // DISABLED (Supabase): await supabase
    .from('reports')
    .update({ status: 'generating' } as never)
    .eq('id', reportId)
    .eq('user_id', userId)

  // Use service client to gather all user data
  const serviceClient = await createServiceClient()

  // Gather user profile
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  // Gather bookings
  const { data: bookings } = await serviceClient
    .from('bookings')
    .select(`
      id, status, payment_status, created_at,
      activity_schedules(
        date_time,
        activities(title, category, price)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  // Gather reflections
  const { data: reflections } = await serviceClient
    .from('reflections')
    .select('id, content, created_at, activities(title)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  // Gather AI analyses
  const { data: analyses } = await serviceClient
    .from('ai_analysis')
    .select('summary, insights, status, created_at')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })

  // Gather instructor feedback received
  const { data: feedback } = await serviceClient
    .from('instructor_feedback')
    .select('rating, comment, created_at, activities(title)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  // Build structured report
  const totalBookings = (bookings ?? []).length
  const completedBookings = (bookings ?? []).filter((b: any) => b.status === 'completed').length
  const totalReflections = (reflections ?? []).length
  const avgFeedbackRating =
    feedback && feedback.length > 0
      ? Math.round(
          ((feedback as any[]).reduce((sum: number, f: any) => sum + (f.rating ?? 0), 0) /
            feedback.length) *
            10
        ) / 10
      : null

  const categoryCounts: Record<string, number> = {}
  for (const b of (bookings ?? []) as any[]) {
    const cat = b.activity_schedules?.activities?.category
    if (cat) categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1
  }

  const p = profile as unknown as { id: string; name: string; email: string; created_at: string } | null
  const reportData = {
    generatedAt: new Date().toISOString(),
    reportType,
    user: {
      id: p?.id,
      name: p?.name,
      email: p?.email,
      memberSince: p?.created_at,
    },
    summary: {
      totalBookings,
      completedBookings,
      completionRate:
        totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0,
      totalReflections,
      averageFeedbackRating: avgFeedbackRating,
      topCategories: Object.entries(categoryCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([category, count]) => ({ category, count })),
    },
    bookings: (bookings ?? []).slice(0, 20).map((b: any) => ({
      id: b.id,
      status: b.status,
      paymentStatus: b.payment_status,
      activityTitle: b.activity_schedules?.activities?.title,
      category: b.activity_schedules?.activities?.category,
      price: b.activity_schedules?.activities?.price,
      dateTime: b.activity_schedules?.date_time,
      createdAt: b.created_at,
    })),
    reflections: (reflections ?? []).slice(0, 10).map((r: any) => ({
      id: r.id,
      activityTitle: r.activities?.title,
      content: r.content?.slice(0, 500),
      createdAt: r.created_at,
    })),
    aiInsights: (analyses ?? []).slice(0, 5).map((a: any) => ({
      summary: a.summary,
      insights: a.insights,
      createdAt: a.created_at,
    })),
    instructorFeedback: (feedback ?? []).slice(0, 10).map((f: any) => ({
      activityTitle: f.activities?.title,
      rating: f.rating,
      comment: f.comment,
      createdAt: f.created_at,
    })),
  }

  // Update report status and store the file_url as a data URI (JSON-encoded)
  const jsonData = JSON.stringify(reportData, null, 2)
  const dataUri = `data:application/json;base64,${Buffer.from(jsonData).toString('base64')}`

  // DISABLED (Supabase): const { error: finalizeError } = await supabase
    .from('reports')
    .update({
      status: 'completed',
      file_url: dataUri,
    } as never)
    .eq('id', reportId)
    .eq('user_id', userId)

  if (finalizeError) {
    // DISABLED (Supabase): await supabase
      .from('reports')
      .update({ status: 'failed' } as never)
      .eq('id', reportId)
      .eq('user_id', userId)
    return NextResponse.json({ error: finalizeError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, report: reportData })
}
