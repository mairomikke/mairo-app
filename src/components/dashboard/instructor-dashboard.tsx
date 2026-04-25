'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import {
  CalendarDays, Users, MessageSquare, QrCode, Clock,
  MapPin, ChevronRight, Building2, Star, Send, Megaphone,
  CheckCircle2, Circle, ArrowLeft, Plus, BookOpen,
} from 'lucide-react'
// DISABLED: import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { cn, formatDate, formatTime, formatDateTime, formatCurrency } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { ActivitySchedule, Activity, InstructorFeedback } from '@/types/database'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface InstructorDashboardProps { userId: string }
interface ScheduleWithActivity extends ActivitySchedule { activity: Activity }
interface FeedbackWithActivity extends InstructorFeedback { activity: Activity }

// ─────────────────────────────────────────────────────────────────────────────
// Dummy data
// ─────────────────────────────────────────────────────────────────────────────
const DUMMY_ORGS = [
  {
    id: 'org-001',
    name: 'マイロスポーツクラブ',
    branch: '渋谷本校',
    color: 'from-indigo-500 to-purple-600',
    activities: [
      {
        id: 'act-001',
        title: 'サッカー教室（初級）',
        branch: '渋谷本校',
        participants: 12,
        capacity: 15,
        instructor: '田中 太郎',
        age: '8〜12歳',
        datetime: '今日 15:00',
        location: '渋谷区スポーツセンターB棟',
        price: 3500,
        description: 'ボールの基礎技術から戦術まで丁寧に指導します。',
      },
      {
        id: 'act-002',
        title: '体操教室（中級）',
        branch: '渋谷本校',
        participants: 8,
        capacity: 10,
        instructor: '田中 太郎',
        age: '10〜15歳',
        datetime: '今日 17:30',
        location: '渋谷区体育館 第2フロア',
        price: 4000,
        description: '転回・側転・倒立などの技を安全に習得します。',
      },
    ],
  },
  {
    id: 'org-002',
    name: 'アカデミースポーツ',
    branch: '新宿校',
    color: 'from-emerald-500 to-teal-600',
    activities: [
      {
        id: 'act-003',
        title: 'テニスクラス（入門）',
        branch: '新宿校',
        participants: 6,
        capacity: 8,
        instructor: '田中 太郎',
        age: '12〜18歳',
        datetime: '明日 10:00',
        location: '新宿テニスコート',
        price: 4500,
        description: '基礎的なラケット操作からラリーまでを指導します。',
      },
    ],
  },
]

const DUMMY_PARTICIPANTS: Record<string, {
  id: string; name: string; age: number; attended: boolean; note: string; rating: number;
  pastFeedback: { date: string; comment: string; rating: number }[]
}[]> = {
  'act-001': [
    { id: 'p1', name: '山田 太郎', age: 10, attended: false, note: '', rating: 0, pastFeedback: [{ date: '2025-03-15', comment: 'ドリブルが上手くなった！', rating: 4 }] },
    { id: 'p2', name: '鈴木 花子', age: 9, attended: false, note: '', rating: 0, pastFeedback: [] },
    { id: 'p3', name: '佐藤 健', age: 11, attended: false, note: '', rating: 0, pastFeedback: [{ date: '2025-03-08', comment: '積極的に参加していた', rating: 5 }] },
  ],
  'act-002': [
    { id: 'p4', name: '田中 愛', age: 13, attended: false, note: '', rating: 0, pastFeedback: [] },
    { id: 'p5', name: '中村 龍', age: 12, attended: false, note: '', rating: 0, pastFeedback: [] },
  ],
  'act-003': [
    { id: 'p6', name: '小林 美咲', age: 15, attended: false, note: '', rating: 0, pastFeedback: [] },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// Chat (mini)
// ─────────────────────────────────────────────────────────────────────────────
interface ChatMsg { role: 'me' | 'them'; text: string }

function MiniChat({ partner, onClose }: { partner: string; onClose: () => void }) {
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    { role: 'them', text: `${partner}です。よろしくお願いします！` },
  ])
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  function send() {
    if (!input.trim()) return
    setMsgs((prev) => [...prev, { role: 'me', text: input.trim() }])
    setInput('')
    setTimeout(() => setMsgs((prev) => [...prev, { role: 'them', text: '承知しました！' }]), 700)
  }

  return (
    <div className="flex flex-col h-96">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-200 shrink-0">
        <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><ArrowLeft className="h-4 w-4" /></button>
        <span className="text-sm font-semibold text-gray-900">{partner}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {msgs.map((m, i) => (
          <div key={i} className={cn('flex', m.role === 'me' ? 'flex-row-reverse' : 'flex-row')}>
            <div className={cn('max-w-[75%] rounded-2xl px-3.5 py-2 text-sm', m.role === 'me' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm')}>{m.text}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2 p-3 border-t border-gray-200 shrink-0">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); send() } }}
          placeholder="メッセージを入力..." className="flex-1 h-9 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <Button size="icon" onClick={send} disabled={!input.trim()}><Send className="h-4 w-4" /></Button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Participant Manager Page
// ─────────────────────────────────────────────────────────────────────────────
function ParticipantManager({ activityId, activityTitle, onBack }: {
  activityId: string; activityTitle: string; onBack: () => void
}) {
  const [participants, setParticipants] = useState(DUMMY_PARTICIPANTS[activityId] ?? [])
  const [feedbackTexts, setFeedbackTexts] = useState<Record<string, string>>({})
  const [feedbackRatings, setFeedbackRatings] = useState<Record<string, number>>({})
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null)
  const [chatUser, setChatUser] = useState<string | null>(null)
  const [broadcastMsg, setBroadcastMsg] = useState('')
  const [broadcastSent, setBroadcastSent] = useState(false)
  const [joinOrgOpen, setJoinOrgOpen] = useState(false)
  const [joinOrgId, setJoinOrgId] = useState('')
  const [joinPassword, setJoinPassword] = useState('')

  function toggleAttendance(id: string) {
    setParticipants((prev) => prev.map((p) => p.id === id ? { ...p, attended: !p.attended } : p))
  }

  function saveFeedback(id: string) {
    if (!feedbackTexts[id]?.trim()) return
    setParticipants((prev) => prev.map((p) => p.id !== id ? p : {
      ...p,
      rating: feedbackRatings[id] ?? 0,
      note: feedbackTexts[id],
      pastFeedback: [{ date: new Date().toISOString().split('T')[0], comment: feedbackTexts[id], rating: feedbackRatings[id] ?? 0 }, ...p.pastFeedback],
    }))
    setFeedbackTexts((prev) => ({ ...prev, [id]: '' }))
    setFeedbackRatings((prev) => ({ ...prev, [id]: 0 }))
  }

  function sendBroadcast() {
    if (!broadcastMsg.trim()) return
    setBroadcastSent(true)
    setBroadcastMsg('')
    setTimeout(() => setBroadcastSent(false), 2000)
  }

  if (chatUser) {
    const user = participants.find((p) => p.id === chatUser)
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-0">
            <MiniChat partner={user?.name ?? ''} onClose={() => setChatUser(null)} />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 transition-colors"><ArrowLeft className="h-5 w-5 text-gray-600" /></button>
        <div>
          <h2 className="text-xl font-bold text-gray-900">参加者管理</h2>
          <p className="text-sm text-gray-500">{activityTitle}</p>
        </div>
      </div>

      {/* Broadcast */}
      <Card className="border-indigo-100 bg-indigo-50">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-indigo-600" />
            <span className="text-sm font-semibold text-indigo-700">全体連絡</span>
          </div>
          {broadcastSent && <p className="text-xs text-green-600 font-medium">✓ 全員に送信しました</p>}
          <div className="flex gap-2">
            <input value={broadcastMsg} onChange={(e) => setBroadcastMsg(e.target.value)}
              placeholder="全参加者に連絡を送る..." className="flex-1 h-9 rounded-lg border border-indigo-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            <Button size="sm" onClick={sendBroadcast} disabled={!broadcastMsg.trim()}>送信</Button>
          </div>
        </CardContent>
      </Card>

      {/* Participants */}
      {participants.map((p) => (
        <Card key={p.id} className="overflow-hidden">
          <CardContent className="p-0">
            {/* Header row */}
            <div className="flex items-center gap-4 p-4 border-b border-gray-100">
              <div className="h-11 w-11 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                {p.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{p.name}</p>
                <p className="text-xs text-gray-400">年齢: {p.age}歳 · ID: {p.id}</p>
              </div>
              {/* Attendance */}
              <button onClick={() => toggleAttendance(p.id)}
                className={cn('flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-2 transition-all', p.attended ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}>
                {p.attended ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                {p.attended ? '出席済' : '出席登録'}
              </button>
              <button onClick={() => setChatUser(p.id)}
                className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg px-3 py-2 hover:bg-indigo-100 transition-colors">
                <MessageSquare className="h-3.5 w-3.5" />チャット
              </button>
            </div>

            {/* Feedback */}
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500">フィードバック</p>
                {p.pastFeedback.length > 0 && (
                  <button onClick={() => setExpandedFeedback(expandedFeedback === p.id ? null : p.id)}
                    className="text-xs text-indigo-600 hover:text-indigo-700">
                    過去の履歴 ({p.pastFeedback.length}) {expandedFeedback === p.id ? '▲' : '▼'}
                  </button>
                )}
              </div>

              {/* Past feedback */}
              {expandedFeedback === p.id && p.pastFeedback.length > 0 && (
                <div className="space-y-2 bg-gray-50 rounded-lg p-3">
                  {p.pastFeedback.map((fb, i) => (
                    <div key={i} className="text-xs border-b border-gray-100 last:border-0 pb-2 last:pb-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-gray-400">{fb.date}</span>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map((s) => <span key={s} className={s <= fb.rating ? 'text-yellow-400' : 'text-gray-200'}>★</span>)}
                        </div>
                      </div>
                      <p className="text-gray-700">{fb.comment}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* New feedback */}
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map((s) => (
                    <button key={s} onClick={() => setFeedbackRatings((prev) => ({ ...prev, [p.id]: s }))}>
                      <span className={cn('text-xl transition-colors', s <= (feedbackRatings[p.id] ?? 0) ? 'text-yellow-400' : 'text-gray-200 hover:text-yellow-300')}>★</span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={feedbackTexts[p.id] ?? ''} onChange={(e) => setFeedbackTexts((prev) => ({ ...prev, [p.id]: e.target.value }))}
                    placeholder="今日のフィードバックを入力..." className="flex-1 h-9 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <Button size="sm" variant="outline" onClick={() => saveFeedback(p.id)} disabled={!feedbackTexts[p.id]?.trim()}>保存</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Join org (new space) */}
      <Card className="border-dashed border-2 border-gray-200">
        <CardContent className="p-4">
          {joinOrgOpen ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-900">新規スペースに参加</p>
              <input value={joinOrgId} onChange={(e) => setJoinOrgId(e.target.value)} placeholder="Organization ID" className="w-full h-9 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <input value={joinPassword} onChange={(e) => setJoinPassword(e.target.value)} type="password" placeholder="パスワード" className="w-full h-9 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setJoinOrgOpen(false)}>キャンセル</Button>
                <Button size="sm" onClick={() => { setJoinOrgOpen(false); setJoinOrgId(''); setJoinPassword('') }}>参加リクエスト</Button>
              </div>
            </div>
          ) : (
            <button onClick={() => setJoinOrgOpen(true)} className="w-full flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-indigo-600 transition-colors py-2">
              <Plus className="h-4 w-4" />新規スペースに参加する
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Activity Card (per org)
// ─────────────────────────────────────────────────────────────────────────────
function ActivityCard({ act, orgColor, onManage }: {
  act: typeof DUMMY_ORGS[0]['activities'][0]
  orgColor: string
  onManage: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const isToday = act.datetime.startsWith('今日')
  const occupancy = Math.round((act.participants / act.capacity) * 100)

  return (
    <Card className={cn('overflow-hidden transition-shadow hover:shadow-md', isToday && 'ring-2 ring-indigo-400')}>
      <CardContent className="p-0">
        {/* Summary row */}
        <div className="flex items-center gap-3 p-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {isToday && <Badge variant="default" className="text-xs">今日</Badge>}
              <p className="font-semibold text-gray-900 truncate">{act.title}</p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{act.branch}</span>
              <span className="flex items-center gap-1"><Users className="h-3 w-3" />{act.participants}/{act.capacity}名</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{act.datetime}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <button onClick={() => setExpanded((v) => !v)} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
              {expanded ? '閉じる ▲' : '詳細 ▼'}
            </button>
          </div>
        </div>

        {/* Occupancy bar */}
        <div className="px-4 pb-2">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>参加率</span>
            <span className={occupancy >= 80 ? 'text-red-500 font-semibold' : 'text-green-600 font-semibold'}>{occupancy}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-100">
            <div className={cn('h-1.5 rounded-full', occupancy >= 80 ? 'bg-red-400' : 'bg-green-400')} style={{ width: `${occupancy}%` }} />
          </div>
        </div>

        {/* Expanded detail */}
        {expanded && (
          <div className="px-4 pb-4 pt-2 space-y-2 border-t border-gray-100 bg-gray-50">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-gray-400">対象年齢</span><p className="text-gray-900 font-medium">{act.age}</p></div>
              <div><span className="text-gray-400">料金</span><p className="text-gray-900 font-medium">{formatCurrency(act.price)}</p></div>
              <div><span className="text-gray-400">担当</span><p className="text-gray-900 font-medium">{act.instructor}</p></div>
              <div><span className="text-gray-400">場所</span><p className="text-gray-900 font-medium">{act.location}</p></div>
            </div>
            <p className="text-xs text-gray-600">{act.description}</p>
            <Button size="sm" className="w-full mt-2" onClick={onManage}>
              <Users className="h-3.5 w-3.5 mr-1.5" />参加者管理ページ
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export function InstructorDashboard({ userId }: InstructorDashboardProps) {
  const user = useAuthStore((s) => s.user)
  const [managingActivity, setManagingActivity] = useState<{ id: string; title: string } | null>(null)
  const [schedules, setSchedules] = useState<ScheduleWithActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      // DISABLED (Supabase): const supabase = createClient()
      const now = new Date().toISOString()
      // DISABLED (Supabase): const { data, error } = await supabase
        .from('activity_schedules')
        .select('*, activity:activities(*)')
        .eq('instructor_id', userId)
        .gte('date_time', now)
        .order('date_time', { ascending: true })
        .limit(20)
      if (!error) setSchedules((data ?? []) as unknown as ScheduleWithActivity[])
      setLoading(false)
    }
    fetchData()
  }, [userId])

  const today = new Date()
  const todayStr = today.toDateString()
  const todaySchedules = schedules.filter((s) => new Date(s.date_time).toDateString() === todayStr)

  // Participant manager overlay
  if (managingActivity) {
    return (
      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        <ParticipantManager
          activityId={managingActivity.id}
          activityTitle={managingActivity.title}
          onBack={() => setManagingActivity(null)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          こんにちは、{user?.name ?? 'インストラクター'}さん
        </h1>
        <p className="text-gray-500 mt-1">{formatDate(today)}</p>
      </div>

      {/* Today's sessions (top priority) */}
      {todaySchedules.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            今日のセッション
          </h2>
          <div className="space-y-2">
            {todaySchedules.map((s) => (
              <Card key={s.id} className="border-indigo-200 bg-indigo-50">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-900">{s.activity.title}</p>
                    <div className="flex gap-3 text-xs text-gray-500 mt-1">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatTime(s.date_time)}</span>
                      {s.activity.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{s.activity.location}</span>}
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />定員{s.capacity}名</span>
                    </div>
                  </div>
                  <Badge variant="success">今日</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Orgs & Activities (dummy) */}
      {DUMMY_ORGS.map((org) => (
        <section key={org.id}>
          {/* Org header card */}
          <div className={cn('rounded-xl p-4 mb-3 text-white bg-gradient-to-r', org.color)}>
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 opacity-80" />
              <div>
                <p className="font-semibold">{org.name}</p>
                <p className="text-xs opacity-75">{org.branch}</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {org.activities.map((act) => (
              <ActivityCard
                key={act.id}
                act={act}
                orgColor={org.color}
                onManage={() => setManagingActivity({ id: act.id, title: act.title })}
              />
            ))}
          </div>
        </section>
      ))}

      {/* Real DB schedules (if any, show separately) */}
      {!loading && schedules.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">DBから取得した予定</h2>
          <div className="space-y-2">
            {schedules.slice(0, 5).map((s) => (
              <Card key={s.id}>
                <CardContent className="p-4">
                  <p className="font-medium text-gray-900">{s.activity.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(s.date_time)} / 定員{s.capacity}名</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
