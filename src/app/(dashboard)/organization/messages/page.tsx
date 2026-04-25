'use client'

import { useState, useRef, useEffect } from 'react'
import { cn, formatRelativeTime } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  MessageSquare, Send, Bell, Star, Megaphone, Users,
  ChevronRight, CheckCheck, ArrowLeft,
} from 'lucide-react'

// ── Dummy data ─────────────────────────────────────────────────────────────
const DUMMY_INQUIRIES = [
  { id: '1', user: '佐藤 健太', text: 'サッカー教室の体験入会について教えてください。', time: '10分前', unread: true, replied: false },
  { id: '2', user: '鈴木 愛子', text: '月謝の支払い方法はどのようになっていますか？', time: '1時間前', unread: true, replied: false },
  { id: '3', user: '田中 大地', text: 'キャンセル規定について確認したいです。', time: '昨日', unread: false, replied: true },
]

const DUMMY_USER_CHATS = [
  { id: 'u1', user: '佐藤 健太', lastMsg: 'ありがとうございました！', time: '5分前', unread: 2 },
  { id: 'u2', user: '鈴木 愛子', lastMsg: '来週も参加できますか？', time: '30分前', unread: 0 },
  { id: 'u3', user: '山田 太郎', lastMsg: '先生に伝えておきます', time: '昨日', unread: 0 },
]

const DUMMY_INSTRUCTOR_CHATS = [
  { id: 'i1', user: '田中 先生', lastMsg: '今週のスケジュール確認しました', time: '20分前', unread: 1 },
  { id: 'i2', user: '山田 先生', lastMsg: '了解です、お疲れ様でした', time: '2時間前', unread: 0 },
]

const DUMMY_REVIEWS = [
  { id: 'r1', user: '佐藤 健太の保護者', activity: 'サッカー教室', rating: 5, text: '子どもが毎回楽しみにしています。先生の指導が丁寧で安心です。', time: '2日前', replied: false },
  { id: 'r2', user: '鈴木 愛子の保護者', activity: '水泳クラス', rating: 4, text: '施設もきれいで、スタッフも親切です。もう少し早い時間帯があれば嬉しいです。', time: '1週間前', replied: true },
  { id: 'r3', user: '田中 大地', activity: 'テニスクラス', rating: 5, text: '上達が実感できてとても嬉しいです！コーチの指導が的確で助かっています。', time: '2週間前', replied: true },
]

interface ChatMsg { role: 'me' | 'them'; text: string }

// ── Mini Chat ─────────────────────────────────────────────────────────────────
function MiniChat({ partner, onBack }: { partner: string; onBack: () => void }) {
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    { role: 'them', text: 'よろしくお願いします！' },
    { role: 'me', text: 'こちらこそよろしくお願いします。' },
  ])
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  function send() {
    if (!input.trim()) return
    setMsgs((prev) => [...prev, { role: 'me', text: input.trim() }])
    setInput('')
    setTimeout(() => setMsgs((prev) => [...prev, { role: 'them', text: '承知しました！' }]), 600)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 shrink-0">
        <button onClick={onBack} className="p-1 rounded hover:bg-gray-100 md:hidden"><ArrowLeft className="h-4 w-4" /></button>
        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-semibold text-indigo-600">{partner[0]}</div>
        <p className="font-medium text-gray-900 text-sm">{partner}</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {msgs.map((m, i) => (
          <div key={i} className={cn('flex', m.role === 'me' ? 'flex-row-reverse' : 'flex-row')}>
            <div className={cn('max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed', m.role === 'me' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm')}>{m.text}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2 p-3 border-t border-gray-200 shrink-0">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="メッセージを入力..." className="flex-1 h-9 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <Button size="icon" onClick={send} disabled={!input.trim()}><Send className="h-4 w-4" /></Button>
      </div>
    </div>
  )
}

// ── Inquiry Panel ─────────────────────────────────────────────────────────────
function InquiryPanel() {
  const [items, setItems] = useState(DUMMY_INQUIRIES)
  const [selected, setSelected] = useState<typeof DUMMY_INQUIRIES[0] | null>(null)
  const [reply, setReply] = useState('')

  function sendReply(id: string) {
    if (!reply.trim()) return
    setItems((prev) => prev.map((x) => x.id === id ? { ...x, replied: true, unread: false } : x))
    setReply('')
    setSelected(null)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Bell className="h-4 w-4 text-orange-500" />問い合わせ一覧</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {items.map((item) => (
            <button key={item.id} onClick={() => { setSelected(item); setItems((prev) => prev.map((x) => x.id === item.id ? { ...x, unread: false } : x)) }}
              className={cn('w-full text-left p-3 rounded-xl border-2 transition-all', selected?.id === item.id ? 'border-indigo-400 bg-indigo-50' : 'border-gray-100 hover:border-gray-200', item.unread && 'bg-orange-50 border-orange-100')}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold text-gray-900">{item.user}</p>
                <div className="flex items-center gap-1.5">
                  {item.unread && <span className="h-2 w-2 rounded-full bg-orange-500" />}
                  {item.replied && <Badge variant="success" className="text-xs py-0">返信済</Badge>}
                  <span className="text-xs text-gray-400">{item.time}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 truncate">{item.text}</p>
            </button>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          {selected ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-900">{selected.user} からの問い合わせ</p>
              <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">{selected.text}</div>
              <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={4} placeholder="返信を入力..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              <Button onClick={() => sendReply(selected.id)} disabled={!reply.trim()} className="w-full"><Send className="h-4 w-4 mr-2" />返信を送る</Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <MessageSquare className="h-10 w-10 mb-2 opacity-30" />
              <p className="text-sm">問い合わせを選択してください</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Broadcast Panel ───────────────────────────────────────────────────────────
function BroadcastPanel() {
  const [msg, setMsg] = useState('')
  const [target, setTarget] = useState<'all' | 'reserved' | 'completed'>('all')
  const [sent, setSent] = useState(false)
  const TARGET_LABELS = { all: '全ユーザー', reserved: '予約中ユーザー', completed: '参加済みユーザー' }

  function handleSend() {
    if (!msg.trim()) return
    setSent(true)
    setMsg('')
    setTimeout(() => setSent(false), 3000)
  }

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Megaphone className="h-4 w-4 text-blue-500" />ブロードキャスト配信</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {sent && <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm font-medium text-center">✓ メッセージを送信しました</div>}
        <div>
          <p className="text-xs text-gray-500 mb-2">送信対象</p>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'reserved', 'completed'] as const).map((t) => (
              <button key={t} onClick={() => setTarget(t)}
                className={cn('text-xs px-3 py-1.5 rounded-full border-2 transition-all font-medium', target === t ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-gray-300')}>
                {TARGET_LABELS[t]}
              </button>
            ))}
          </div>
        </div>
        <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={4} placeholder="配信メッセージを入力（例: 今週の体験クラスは定員残り2名です！）" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
        <Button onClick={handleSend} disabled={!msg.trim()} className="w-full"><Megaphone className="h-4 w-4 mr-2" />{TARGET_LABELS[target]}に送信</Button>
      </CardContent>
    </Card>
  )
}

// ── Reviews Panel ─────────────────────────────────────────────────────────────
function ReviewsPanel() {
  const [reviews, setReviews] = useState(DUMMY_REVIEWS)
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({})
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length

  function sendReply(id: string) {
    if (!replyTexts[id]?.trim()) return
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, replied: true } : r))
    setReplyTexts((prev) => ({ ...prev, [id]: '' }))
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-100">
        <CardContent className="p-4 flex items-center gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-yellow-600">{avg.toFixed(1)}</p>
            <p className="text-xs text-gray-500 mt-0.5">総合評価</p>
          </div>
          <div className="flex gap-1">
            {[1,2,3,4,5].map((s) => <Star key={s} className={cn('h-5 w-5', s <= Math.round(avg) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300')} />)}
          </div>
          <p className="text-sm text-gray-500">{reviews.length}件のレビュー</p>
        </CardContent>
      </Card>
      {/* Reviews list */}
      {reviews.map((r) => (
        <Card key={r.id}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-gray-900">{r.user}</p>
                <p className="text-xs text-gray-400">{r.activity} · {r.time}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {[1,2,3,4,5].map((s) => <Star key={s} className={cn('h-3.5 w-3.5', s <= r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200')} />)}
              </div>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{r.text}</p>
            {r.replied ? (
              <p className="text-xs text-green-600 flex items-center gap-1"><CheckCheck className="h-3.5 w-3.5" />返信済み</p>
            ) : (
              <div className="flex gap-2">
                <input value={replyTexts[r.id] ?? ''} onChange={(e) => setReplyTexts((prev) => ({ ...prev, [r.id]: e.target.value }))}
                  placeholder="返信を入力..." className="flex-1 h-8 border border-gray-300 rounded-md px-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <Button size="sm" onClick={() => sendReply(r.id)} disabled={!replyTexts[r.id]?.trim()}>返信</Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ── Chat List + MiniChat ──────────────────────────────────────────────────────
function ChatListPanel({ chats }: { chats: typeof DUMMY_USER_CHATS }) {
  const [selected, setSelected] = useState<string | null>(null)
  const selectedChat = chats.find((c) => c.id === selected)

  if (selectedChat) {
    return (
      <div className="h-[500px] border border-gray-200 rounded-xl overflow-hidden">
        <MiniChat partner={selectedChat.user} onBack={() => setSelected(null)} />
      </div>
    )
  }

  return (
    <Card>
      <CardContent className="p-0 divide-y divide-gray-100">
        {chats.map((c) => (
          <button key={c.id} onClick={() => setSelected(c.id)} className="w-full text-left flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors">
            <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-semibold text-indigo-600 shrink-0">{c.user[0]}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">{c.user}</p>
                <span className="text-xs text-gray-400">{c.time}</span>
              </div>
              <p className="text-xs text-gray-500 truncate mt-0.5">{c.lastMsg}</p>
            </div>
            {c.unread > 0 && <span className="h-5 w-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold shrink-0">{c.unread}</span>}
          </button>
        ))}
      </CardContent>
    </Card>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function OrgMessagesPage() {
  const totalUnread = DUMMY_INQUIRIES.filter((i) => i.unread).length
    + DUMMY_USER_CHATS.reduce((s, c) => s + c.unread, 0)
    + DUMMY_INSTRUCTOR_CHATS.reduce((s, c) => s + c.unread, 0)

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          メッセージ・コミュニケーション
          {totalUnread > 0 && <span className="text-sm font-bold bg-red-500 text-white rounded-full px-2 py-0.5">{totalUnread}</span>}
        </h1>
        <p className="text-gray-500 mt-1">問い合わせ対応・チャット・レビュー管理</p>
      </div>

      <Tabs defaultValue="inquiry">
        <TabsList>
          <TabsTrigger value="inquiry" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />問い合わせ
            {DUMMY_INQUIRIES.filter((i) => i.unread).length > 0 && (
              <span className="ml-1 text-xs font-bold bg-orange-500 text-white rounded-full w-4 h-4 flex items-center justify-center">{DUMMY_INQUIRIES.filter((i) => i.unread).length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />ユーザーチャット
          </TabsTrigger>
          <TabsTrigger value="instructors" className="flex items-center gap-2">
            <Users className="h-4 w-4" />指導者チャット
          </TabsTrigger>
          <TabsTrigger value="broadcast" className="flex items-center gap-2">
            <Megaphone className="h-4 w-4" />配信
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex items-center gap-2">
            <Star className="h-4 w-4" />レビュー
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inquiry" className="mt-4"><InquiryPanel /></TabsContent>
        <TabsContent value="users" className="mt-4"><ChatListPanel chats={DUMMY_USER_CHATS} /></TabsContent>
        <TabsContent value="instructors" className="mt-4"><ChatListPanel chats={DUMMY_INSTRUCTOR_CHATS} /></TabsContent>
        <TabsContent value="broadcast" className="mt-4"><BroadcastPanel /></TabsContent>
        <TabsContent value="reviews" className="mt-4"><ReviewsPanel /></TabsContent>
      </Tabs>
    </div>
  )
}
