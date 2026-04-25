'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, BookOpen, Sparkles, ChevronDown, ChevronUp, Clock, BrainCircuit, Send, Globe } from 'lucide-react'
import { useReflections } from '@/hooks/use-reflections'
import { ReflectionModal } from '@/components/reflection/reflection-modal'
import { cn, formatDate, formatRelativeTime, truncate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { ReflectionWithAnalysis } from '@/types/database'

// ── AI Coach チャット ─────────────────────────────────────
interface ChatMsg { role: 'user' | 'ai'; text: string }

const COACH_STARTERS = [
  '最近参加した活動で、一番印象に残ったことは何ですか？',
  '今の自分の強みと、もっと伸ばしたい点を教えてください。',
  '次にチャレンジしてみたいことはありますか？',
]

function AICoachChat() {
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    { role: 'ai', text: 'こんにちは！AI Coachです。活動の振り返りをお手伝いします。何でも話しかけてください 😊' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  // シンプルなルールベース応答（APIなし）
  function generateReply(userText: string): string {
    const t = userText
    if (t.includes('楽しかった') || t.includes('楽しい')) return 'それは素晴らしいですね！楽しいと感じたのはどんな瞬間でしたか？'
    if (t.includes('難しかった') || t.includes('大変') || t.includes('つらい')) return '困難があったのですね。それを乗り越えるために、どんな工夫をしましたか？'
    if (t.includes('成長') || t.includes('上達')) return 'その成長はどんなことで実感しましたか？具体的なエピソードがあれば教えてください！'
    if (t.includes('友達') || t.includes('仲間') || t.includes('チーム')) return '仲間との活動は特別ですね。一緒に取り組んだことで、どんな発見がありましたか？'
    if (t.includes('もっと') || t.includes('もう少し') || t.includes('次は')) return '向上心がありますね！次のステップとして、何か具体的な目標を立ててみましょうか？'
    if (t.includes('疲れ') || t.includes('休') ) return '無理せず休むことも大切です。体と心のバランスを保ちながら取り組みましょう 🌿'
    return `「${t.slice(0, 20)}...」について、もう少し詳しく教えていただけますか？それがあなたの成長にどう繋がっているか、一緒に考えましょう！`
  }

  function handleSend() {
    const trimmed = input.trim()
    if (!trimmed || loading) return
    setMsgs((prev) => [...prev, { role: 'user', text: trimmed }])
    setInput('')
    setLoading(true)
    setTimeout(() => {
      setMsgs((prev) => [...prev, { role: 'ai', text: generateReply(trimmed) }])
      setLoading(false)
    }, 800)
  }

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-5 w-5 text-purple-500" />
          <h3 className="font-semibold text-gray-900">AI Coach 対話</h3>
        </div>
        {/* スターター */}
        <div className="flex flex-wrap gap-2">
          {COACH_STARTERS.map((s) => (
            <button
              key={s}
              onClick={() => setInput(s)}
              className="text-xs border border-purple-200 text-purple-600 rounded-full px-3 py-1 hover:bg-purple-50 transition-colors"
            >
              {s.slice(0, 18)}…
            </button>
          ))}
        </div>
        {/* メッセージ */}
        <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
          {msgs.map((m, i) => (
            <div key={i} className={cn('flex gap-2', m.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
              <div className={cn(
                'max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed',
                m.role === 'user' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'
              )}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2">
              <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-2 text-sm text-gray-400">
                考えています<span className="animate-pulse">...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        {/* 入力 */}
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder="何でも話しかけてください..."
            className="flex-1 h-10 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Button size="icon" onClick={handleSend} disabled={!input.trim() || loading}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function AIStatusBadge({ status }: { status: string }) {
  if (status === 'completed') return <Badge variant="success">AI分析完了</Badge>
  if (status === 'processing') return <Badge variant="info">分析中...</Badge>
  if (status === 'pending') return <Badge variant="warning">分析待ち</Badge>
  if (status === 'failed') return <Badge variant="danger">分析失敗</Badge>
  return null
}

interface ReflectionCardProps {
  reflection: ReflectionWithAnalysis
}

function ReflectionCard({ reflection }: ReflectionCardProps) {
  const [expanded, setExpanded] = useState(false)
  const analysis = reflection.ai_analysis

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatRelativeTime(reflection.created_at)}
              </span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-400">{formatDate(reflection.created_at)}</span>
            </div>
          </div>
          <div className="shrink-0">
            {analysis ? (
              <AIStatusBadge status={analysis.status} />
            ) : (
              <Badge variant="secondary">未分析</Badge>
            )}
          </div>
        </div>

        {/* Content Preview */}
        <div className="text-sm text-gray-700 leading-relaxed">
          {expanded ? (
            <p>{reflection.content}</p>
          ) : (
            <p>{truncate(reflection.content, 200)}</p>
          )}
        </div>

        {/* AI Insights (expanded) */}
        {expanded && analysis && analysis.status === 'completed' && (
          <div className="space-y-3 border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              <h4 className="text-sm font-semibold text-indigo-700">AI インサイト</h4>
            </div>
            {analysis.summary && (
              <p className="text-sm text-gray-600 bg-indigo-50 rounded-lg p-3">
                {analysis.summary}
              </p>
            )}
            {analysis.insights && analysis.insights.length > 0 && (
              <div className="space-y-2">
                {analysis.insights.map((insight, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-indigo-100 bg-white p-4 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900">{insight.title}</p>
                      {insight.score !== undefined && (
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-100 rounded-full px-2 py-0.5">
                          {insight.score}/10
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{insight.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Toggle */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              折りたたむ
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              {reflection.content.length > 200 ? '続きを読む' : 'AIインサイトを見る'}
            </>
          )}
        </button>
      </CardContent>
    </Card>
  )
}

export default function ReflectionsPage() {
  const { data: reflections, isPending } = useReflections()
  const [modalOpen, setModalOpen] = useState(false)
  const [externalNote, setExternalNote] = useState('')
  const [externalSaved, setExternalSaved] = useState(false)

  function handleSaveExternal() {
    if (!externalNote.trim()) return
    setExternalSaved(true)
    setTimeout(() => setExternalSaved(false), 2000)
    setExternalNote('')
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">振り返り</h1>
          <p className="text-gray-500 mt-1">
            活動の記録とAIによる成長分析
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          新しい振り返り
        </Button>
      </div>

      {/* ── AI Coach 対話 ─────────────────────────────────── */}
      <AICoachChat />

      {/* ── アプリ外活動メモ ──────────────────────────────── */}
      <Card className="border-green-100 bg-green-50">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-gray-900">アプリ外の活動を記録</h3>
            <span className="text-xs text-green-600 bg-green-100 rounded-full px-2 py-0.5">部活・塾・自主練など</span>
          </div>
          <textarea
            value={externalNote}
            onChange={(e) => setExternalNote(e.target.value)}
            placeholder="例）今日は友達と自主練をした。シュート精度が上がってきた感じがする..."
            rows={3}
            className="w-full rounded-lg border border-green-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none placeholder:text-gray-400"
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={handleSaveExternal}
              disabled={!externalNote.trim()}
              className="border-green-300 text-green-700 hover:bg-green-100"
            >
              {externalSaved ? '保存しました ✓' : 'メモを保存'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {!isPending && reflections && reflections.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{reflections.length}</p>
              <p className="text-xs text-gray-500 mt-1">振り返り合計</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-indigo-600">
                {reflections.filter((r) => r.ai_analysis?.status === 'completed').length}
              </p>
              <p className="text-xs text-gray-500 mt-1">AI分析完了</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-orange-500">
                {reflections.filter((r) => !r.ai_analysis || r.ai_analysis.status === 'pending').length}
              </p>
              <p className="text-xs text-gray-500 mt-1">分析待ち</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reflections List */}
      {isPending ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !reflections || reflections.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            <BookOpen className="h-14 w-14 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium text-gray-700">振り返りがまだありません</p>
            <p className="text-sm mt-2 mb-6">
              アクティビティに参加したら振り返りを書いてみましょう
            </p>
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              最初の振り返りを書く
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reflections.map((reflection) => (
            <ReflectionCard key={reflection.id} reflection={reflection} />
          ))}
        </div>
      )}

      {/* Modal */}
      <ReflectionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={() => setModalOpen(false)}
      />
    </div>
  )
}
