import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { reflectionId, userId } = await request.json()

  if (!reflectionId || !userId) {
    return NextResponse.json(
      { error: 'reflectionId and userId are required' },
      { status: 400 }
    )
  }

  // モックデータ生成
  const activityTitle = 'アクティビティ'
  const mockSummary = `${activityTitle}についての振り返り: 自己認識と成長マインドセットの良い発揮が見られます。`
  const mockInsights = [
    { type: 'strength', text: '核心概念の明確な理解を示している' },
    { type: 'growth', text: '次回はより高度なトピックに挑戦してみましょう' },
    { type: 'pattern', text: 'アクティビティを通じて一貫した努力が見られます' },
  ]

  return NextResponse.json({
    success: true,
    summary: mockSummary,
    insights: mockInsights,
  })
}