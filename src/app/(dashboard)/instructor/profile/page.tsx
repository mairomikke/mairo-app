'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  User, Star, Building2, ScrollText, HelpCircle,
  ChevronRight, Pencil, Shield, Bell, ToggleLeft, ToggleRight,
} from 'lucide-react'
import toast from 'react-hot-toast'

const DUMMY_ORGS = [
  { id: 'org-001', name: 'マイロスポーツクラブ', branch: '渋谷本校', since: '2024年4月', role: 'インストラクター', active: true },
  { id: 'org-002', name: 'アカデミースポーツ', branch: '新宿校', since: '2024年9月', role: 'インストラクター', active: true },
]

const DUMMY_REVIEWS = [
  { id: 'r1', user: '佐藤さんの保護者', rating: 5, text: '熱心で分かりやすい指導です。子どもが毎回楽しみにしています！', date: '2025-04-10' },
  { id: 'r2', user: '鈴木さん', rating: 4, text: 'とても丁寧に教えてくださいました。上達が実感できています。', date: '2025-03-28' },
  { id: 'r3', user: '田中さんの保護者', rating: 5, text: '子どもの個性に合わせた指導が素晴らしい。感謝しています。', date: '2025-03-15' },
]

// ── Public Profile ────────────────────────────────────────────────────────────
function PublicProfileSection() {
  const user = useAuthStore((s) => s.user)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: user?.name ?? '田中 太郎',
    field: 'サッカー / 体操 / フィットネス',
    achievement: 'JFA公認B級ライセンス取得 / 全国大会出場経験 / 指導歴10年',
    style: '参加者の個性を尊重しながら、楽しさと上達を両立した指導を心がけています。',
    motto: '「挑戦する勇気が、可能性の扉を開く」',
  })
  const avg = DUMMY_REVIEWS.reduce((s, r) => s + r.rating, 0) / DUMMY_REVIEWS.length

  function save() {
    setEditing(false)
    toast.success('プロフィールを保存しました')
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4 text-indigo-500" />公開プロフィール</CardTitle>
          {!editing && <Button variant="outline" size="sm" onClick={() => setEditing(true)}><Pencil className="h-3.5 w-3.5 mr-1" />編集</Button>}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Avatar & rating */}
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {form.name[0]}
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{form.name}</p>
            <div className="flex items-center gap-1.5 mt-1">
              {[1,2,3,4,5].map((s) => (
                <Star key={s} className={cn('h-4 w-4', s <= Math.round(avg) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200')} />
              ))}
              <span className="text-sm text-gray-500 ml-1">{avg.toFixed(1)} ({DUMMY_REVIEWS.length}件)</span>
            </div>
          </div>
        </div>

        {editing ? (
          <div className="space-y-3">
            {([
              ['name', '名前'],
              ['field', '指導分野'],
              ['achievement', '実績'],
              ['style', '教育スタイル'],
              ['motto', '座右の銘'],
            ] as [keyof typeof form, string][]).map(([key, label]) => (
              <div key={key}>
                <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                {key === 'style' ? (
                  <textarea value={form[key]} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))} rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                ) : (
                  <input value={form[key]} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                    className="w-full h-9 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                )}
              </div>
            ))}
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}>キャンセル</Button>
              <Button size="sm" onClick={save}>保存</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            {[
              ['指導分野', form.field],
              ['実績', form.achievement],
              ['教育スタイル', form.style],
              ['座右の銘', form.motto],
            ].map(([label, value]) => (
              <div key={label as string}>
                <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                <p className="text-gray-900">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Reviews */}
        <div className="border-t border-gray-100 pt-4 space-y-3">
          <p className="text-sm font-semibold text-gray-700">レビュー</p>
          {DUMMY_REVIEWS.map((r) => (
            <div key={r.id} className="p-3 rounded-xl bg-gray-50 space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-700">{r.user}</p>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map((s) => <Star key={s} className={cn('h-3.5 w-3.5', s <= r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200')} />)}
                </div>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{r.text}</p>
              <p className="text-xs text-gray-400">{r.date}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Account Management ────────────────────────────────────────────────────────
function AccountSection() {
  const user = useAuthStore((s) => s.user)
  return (
    <Card>
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-blue-500" />アカウント管理</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">メールアドレス</span>
          <span className="text-gray-900 font-medium">{user?.email ?? '—'}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">ユーザーID</span>
          <span className="text-gray-400 font-mono text-xs">{user?.id?.slice(0, 12) ?? '—'}...</span>
        </div>
        <div className="pt-2 space-y-2">
          <Button variant="outline" size="sm" className="w-full" onClick={() => toast('パスワード変更メールを送信しました')}>
            パスワードを変更
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Orgs ──────────────────────────────────────────────────────────────────────
function OrgsSection() {
  const [orgs] = useState(DUMMY_ORGS)
  return (
    <Card>
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4 text-green-500" />所属団体一覧</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {orgs.map((org) => (
          <div key={org.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
            <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">{org.name[0]}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{org.name}</p>
              <p className="text-xs text-gray-400">{org.branch} · {org.since}〜</p>
            </div>
            <Badge variant={org.active ? 'success' : 'secondary'} className="text-xs">{org.active ? '在籍中' : '終了'}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// ── Notification Settings ─────────────────────────────────────────────────────
function NotificationSection() {
  const [settings, setSettings] = useState([
    { id: 'schedule', label: 'スケジュール変更', on: true },
    { id: 'participant', label: '参加者追加・変更', on: true },
    { id: 'message', label: '団体からのメッセージ', on: true },
    { id: 'review', label: 'レビュー投稿', on: false },
  ])

  return (
    <Card>
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4 text-orange-500" />通知設定</CardTitle></CardHeader>
      <CardContent className="space-y-1">
        {settings.map((s) => (
          <div key={s.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
            <span className="text-sm text-gray-700">{s.label}</span>
            <button onClick={() => setSettings((prev) => prev.map((x) => x.id === s.id ? { ...x, on: !x.on } : x))}>
              {s.on ? <ToggleRight className="h-7 w-7 text-indigo-600" /> : <ToggleLeft className="h-7 w-7 text-gray-300" />}
            </button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function InstructorProfilePage() {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">プロフィール</h1>
        <p className="text-gray-500 mt-1">公開プロフィール・アカウント・所属団体の管理</p>
      </div>

      <PublicProfileSection />
      <AccountSection />
      <OrgsSection />
      <NotificationSection />

      {/* Others */}
      <Card>
        <CardContent className="p-2 space-y-1">
          <button onClick={() => toast('利用規約ページは近日公開予定です')}
            className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700">
            <span className="flex items-center gap-2"><ScrollText className="h-4 w-4 text-gray-400" />利用規約</span>
            <ChevronRight className="h-4 w-4 text-gray-300" />
          </button>
          <button onClick={() => toast('お問い合わせ: support@mairo.app')}
            className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700">
            <span className="flex items-center gap-2"><HelpCircle className="h-4 w-4 text-gray-400" />お問い合わせ</span>
            <ChevronRight className="h-4 w-4 text-gray-300" />
          </button>
        </CardContent>
      </Card>
    </div>
  )
}
