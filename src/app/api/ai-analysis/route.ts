import { NextRequest, NextResponse } from 'next/server'
// DISABLED: import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const { reflectionId, userId } = await request.json()

  if (!reflectionId || !userId) {
    return NextResponse.json(
      { error: 'reflectionId and userId are required' },
      { status: 400 }
    )
  }

  // In production, this calls Claude API
  // For now, generate a mock analysis
  // DISABLED (Supabase): const supabase = await createClient()

  // Verify authenticated user
  const {
    data: { user },
  // DISABLED (Supabase): } = await supabase.auth.getUser()

  if (!user || user.id !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get reflection content
  // DISABLED (Supabase): const { data: reflection, error: reflectionError } = await supabase
    .from('reflections')
    .select('content, activity_id, activities(title)')
    .eq('id', reflectionId)
    .single()

  if (reflectionError || !reflection) {
    return NextResponse.json({ error: 'Reflection not found' }, { status: 404 })
  }

  // Simulate AI processing (in prod: call Anthropic API)
  const activityTitle = (reflection as any)?.activities?.title ?? 'アクティビティ'
  const mockSummary = `${activityTitle}についての振り返り: 自己認識と成長マインドセットの良い発揮が見られます。`
  const mockInsights = [
    { type: 'strength', text: '核心概念の明確な理解を示している' },
    { type: 'growth', text: '次回はより高度なトピックに挑戦してみましょう' },
    { type: 'pattern', text: 'アクティビティを通じて一貫した努力が見られます' },
  ]

  // DISABLED (Supabase): const { error: updateError } = await supabase
    .from('ai_analysis')
    .update({
      summary: mockSummary,
      insights: mockInsights,
      status: 'completed',
      updated_at: new Date().toISOString(),
    } as never)
    .eq('reflection_id', reflectionId)
    .eq('user_id', userId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Create notification
  // DISABLED (Supabase): const { error: notifError } = await supabase.from('notifications').insert({
    user_id: userId,
    type: 'feedback_received',
    content: 'AIによる成長分析が完成しました！',
    is_read: false,
    metadata: { reflection_id: reflectionId },
  } as never)

  if (notifError) {
    // Non-fatal: log and continue
    console.error('Failed to create notification:', notifError.message)
  }

  return NextResponse.json({ success: true, summary: mockSummary })
}
