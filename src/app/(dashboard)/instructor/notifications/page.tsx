'use client'

import { useState, useRef, useEffect } from 'react'
import { cn, formatRelativeTime } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Bell, MessageSquare, BookOpen, Send, CheckCheck,
  ArrowLeft, Plus, Pencil, Save,
} from 'lucide-react'
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '@/hooks/use-notifications'

// ── Dummy Org Chat ────────────────────────────────────────────────────────────
const DUMMY_ORG_CHATS = [
  {
    id: 'org-001',
    name: 'マイロスポーツクラブ',
    messages: [
      { id: 'm1', sender: '田中 管理者', role: 'admin', text: '今週のスケジュール変更があります。金曜17時のクラスは18時スタートに変更してください。', time: '10分前', isMe: false },
      { id: 'm2', sender: '自分', role: 'instructor', text: '承知しました！参加者への連絡もしておきます。', time: '8分前', isMe: true },
      { id: 'm3', sender: '山田 スタッフ', role: 'staff', text: '体育館の鍵は私が持っています。早めに来れそうですか？', time: '5分前', isMe: false },
    ],
    unread: 1,
  },
  {
    id: 'org-002',
    name: 'アカデミースポーツ',
    messages: [
      { id: 'm4', sender: '鈴木 管理者', role: 'admin', text: '来月の新クラス立ち上げについて相談したいです。', time: '昨日', isMe: false },
    ],
    unread: 0,
  },
]

// ── Dummy Shared Notes ────────────────────────────────────────────────────────
const INITIAL_NOTES = [
  {
    id: 'n1',
    org: 'マイロスポーツクラブ',
    category: 'クラス方針',
    content: '・安全第一で指導すること\n・参加者の個人差に合わせた指導\n・保護者への進捗報告は月1回',
    updatedAt: '2025-04-01',
    editing: false,
  },
  {
    id: 'n2',
    org: 'マイロスポーツクラブ',
    category: '注意点',
    content: '・アレルギー持ちの生徒: 山田太郎（ナッツ類）\n・水曜クラスは体育館Bに変更',
    updatedAt: '2025-04-10',
    editing: false,
  },
  {
    id: 'n3',
    org: 'マイロスポーツクラブ',
    category: '生徒メモ',
    content: '・鈴木花子: 最近伸び著しい。試合出場を検討\n・佐藤健: 集中力UP。褒めて伸びるタイプ',
    updatedAt: '2025-04-15',
    editing: false,
  },
]

// ── Org Chat Panel ────────────────────────────────────────────────────────────
function OrgChatPanel() {
  const [selectedOrg, setSelectedOrg] = useState<typeof DUMMY_ORG_CHATS[0] | null>(null)
  const [orgChats, setOrgChats] = useState(DUMMY_ORG_CHATS)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [selectedOrg, orgChats])

  function sendMsg() {
    if (!input.trim() || !selectedOrg) return
    const newMsg = { id: `m${Date.now()}`, sender: '自分', role: 'instructor', text: input.trim(), time: 'たった今', isMe: true }
    setOrgChats((prev) => prev.map((c) => c.id === selectedOrg.id ? { ...c, messages: [...c.messages, newMsg], unread: 0 } : c))
    setSelectedOrg((prev) => prev ? { ...prev, messages: [...prev.messages, newMsg] } : prev)
    setInput('')
    setTimeout(() => {
      const reply = { id: `m${Date.now()}r`, sender: '田中 管理者', role: 'admin', text: '了解しました！ありがとうございます。', time: 'たった今', isMe: false }
      setOrgChats((prev) => prev.map((c) => c.id === selectedOrg.id ? { ...c, messages: [...c.messages, reply] } : c))
      setSelectedOrg((prev) => prev ? { ...prev, messages: [...prev.messages, reply] } : prev)
    }, 900)
  }

  if (selectedOrg) {
    const currentChat = orgChats.find((c) => c.id === selectedOrg.id) ?? selectedOrg
    return (
      <div className="flex flex-col h-[500px]">
        <div className="flex items-center gap-3 p-3 border-b border-gray-200 shrink-0">
          <button onClick={() => setSelectedOrg(null)} className="p-1 rounded hover:bg-gray-100"><ArrowLeft className="h-4 w-4" /></button>
          <p className="font-semibold text-gray-900 text-sm">{currentChat.name}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {currentChat.messages.map((m) => (
            <div key={m.id} className={cn('flex flex-col', m.isMe ? 'items-end' : 'items-start')}>
              {!m.isMe && <span className="text-xs text-gray-400 mb-1 ml-1">{m.sender}</span>}
              <div className={cn('max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed', m.isMe ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm')}>
                {m.text}
              </div>
              <span className="text-xs text-gray-400 mt-1 mx-1">{m.time}</span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <div className="flex gap-2 p-3 border-t border-gray-200 shrink-0">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); sendMsg() } }}
            placeholder="メッセージを入力..." className="flex-1 h-9 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <Button size="icon" onClick={sendMsg} disabled={!input.trim()}><Send className="h-4 w-4" /></Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {orgChats.map((org) => (
        <button key={org.id} onClick={() => setSelectedOrg(org)}
          className="w-full text-left flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all">
          <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">
            {org.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm">{org.name}</p>
            <p className="text-xs text-gray-400 truncate mt-0.5">{org.messages[org.messages.length - 1]?.text}</p>
          </div>
          {org.unread > 0 && (
            <span className="h-5 w-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold shrink-0">{org.unread}</span>
          )}
        </button>
      ))}
    </div>
  )
}

// ── Shared Notes Panel ────────────────────────────────────────────────────────
function SharedNotesPanel() {
  const [notes, setNotes] = useState(INITIAL_NOTES)
  const [editContents, setEditContents] = useState<Record<string, string>>({})
  const [addingNote, setAddingNote] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [newContent, setNewContent] = useState('')

  const CATEGORY_COLORS: Record<string, string> = {
    'クラス方針': 'bg-blue-100 text-blue-700',
    '注意点': 'bg-red-100 text-red-700',
    '生徒メモ': 'bg-green-100 text-green-700',
  }

  function startEdit(id: string, content: string) {
    setNotes((prev) => prev.map((n) => n.id === id ? { ...n, editing: true } : n))
    setEditContents((prev) => ({ ...prev, [id]: content }))
  }
  function saveEdit(id: string) {
    setNotes((prev) => prev.map((n) => n.id === id ? { ...n, editing: false, content: editContents[id] ?? n.content, updatedAt: new Date().toISOString().split('T')[0] } : n))
  }
  function addNote() {
    if (!newCategory.trim() || !newContent.trim()) return
    setNotes((prev) => [...prev, { id: `n${Date.now()}`, org: 'マイロスポーツクラブ', category: newCategory, content: newContent, updatedAt: new Date().toISOString().split('T')[0], editing: false }])
    setNewCategory(''); setNewContent(''); setAddingNote(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setAddingNote(true)}><Plus className="h-3.5 w-3.5 mr-1" />メモを追加</Button>
      </div>
      {addingNote && (
        <Card className="border-dashed border-2 border-indigo-300">
          <CardContent className="p-4 space-y-3">
            <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="カテゴリ（クラス方針 / 注意点 / 生徒メモ等）"
              className="w-full h-9 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} rows={3} placeholder="内容を入力..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setAddingNote(false)}>キャンセル</Button>
              <Button size="sm" onClick={addNote}>保存</Button>
            </div>
          </CardContent>
        </Card>
      )}
      {notes.map((note) => (
        <Card key={note.id}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', CATEGORY_COLORS[note.category] ?? 'bg-gray-100 text-gray-700')}>{note.category}</span>
                <span className="text-xs text-gray-400">{note.org}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">更新: {note.updatedAt}</span>
                {!note.editing
                  ? <button onClick={() => startEdit(note.id, note.content)} className="p-1 rounded hover:bg-gray-100"><Pencil className="h-3.5 w-3.5 text-gray-400" /></button>
                  : <button onClick={() => saveEdit(note.id)} className="p-1 rounded hover:bg-green-100 text-green-600"><Save className="h-3.5 w-3.5" /></button>
                }
              </div>
            </div>
            {note.editing ? (
              <textarea value={editContents[note.id] ?? note.content} onChange={(e) => setEditContents((prev) => ({ ...prev, [note.id]: e.target.value }))}
                rows={4} className="w-full border border-indigo-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            ) : (
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{note.content}</pre>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ── Notification Timeline ─────────────────────────────────────────────────────
function NotificationTimeline() {
  const { data: result, isPending } = useNotifications({ pageSize: 30 })
  const { mutate: markRead } = useMarkAsRead()
  const { mutate: markAll } = useMarkAllAsRead()
  const notifications = result?.data ?? []
  const unread = notifications.filter((n) => !n.is_read)

  const TYPE_LABELS: Record<string, string> = {
    booking_confirmation: '予約確認', reminder: 'リマインダー',
    feedback_received: 'フィードバック', payment_update: '支払い', message: 'メッセージ',
  }

  return (
    <div className="space-y-3">
      {unread.length > 0 && (
        <div className="flex justify-end">
          <button onClick={() => markAll()} className="text-xs text-indigo-600 flex items-center gap-1 hover:text-indigo-700">
            <CheckCheck className="h-3.5 w-3.5" />すべて既読にする
          </button>
        </div>
      )}
      {isPending ? (
        <div className="flex justify-center py-8"><div className="animate-spin h-6 w-6 rounded-full border-2 border-indigo-600 border-t-transparent" /></div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Bell className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">通知はありません</p>
        </div>
      ) : (
        notifications.map((n) => (
          <button key={n.id} onClick={() => !n.is_read && markRead(n.id)}
            className={cn('w-full text-left flex items-start gap-3 p-4 rounded-xl border transition-all', n.is_read ? 'border-gray-100 bg-white hover:bg-gray-50' : 'border-indigo-100 bg-indigo-50 hover:bg-indigo-100')}>
            <span className={cn('h-2 w-2 rounded-full mt-2 shrink-0', n.is_read ? 'bg-transparent' : 'bg-indigo-500')} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="text-xs py-0">{TYPE_LABELS[n.type] ?? n.type}</Badge>
                <span className="text-xs text-gray-400">{formatRelativeTime(n.created_at)}</span>
              </div>
              <p className={cn('text-sm leading-snug', n.is_read ? 'text-gray-600' : 'font-semibold text-gray-900')}>{n.title}</p>
              {n.body && <p className="text-xs text-gray-500 mt-0.5 truncate">{n.body}</p>}
            </div>
          </button>
        ))
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function InstructorNotificationsPage() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">通知・コミュニケーション</h1>
        <p className="text-gray-500 mt-1">通知・団体チャット・共有ノート</p>
      </div>

      <Tabs defaultValue="notifications">
        <TabsList>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />通知
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />団体チャット
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />共有ノート
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="mt-4">
          <NotificationTimeline />
        </TabsContent>
        <TabsContent value="chat" className="mt-4">
          <Card><CardContent className="p-0"><OrgChatPanel /></CardContent></Card>
        </TabsContent>
        <TabsContent value="notes" className="mt-4">
          <SharedNotesPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
