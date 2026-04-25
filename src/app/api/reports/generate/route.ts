import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { reportId, userId, reportType = 'full' } = await request.json()

  if (!reportId || !userId) {
    return NextResponse.json(
      { error: 'reportId and userId are required' },
      { status: 400 }
    )
  }

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // モックデータ生成
  const reportData = {
    generatedAt: new Date().toISOString(),
    reportType,
    user: {
      id: userId,
      name: 'ユーザー',
      email: 'example@email.com',
      memberSince: new Date().toISOString(),
    },
    summary: {
      totalBookings: 0,
      completedBookings: 0,
      completionRate: 0,
      totalReflections: 0,
      averageFeedbackRating: null,
      topCategories: [],
    },
    bookings: [],
    reflections: [],
    aiInsights: [],
    instructorFeedback: [],
  }

  return NextResponse.json({ success: true, report: reportData })
}