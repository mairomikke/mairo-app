'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Building2, Users, CreditCard, Bell, ScrollText, HelpCircle,
  ChevronRight, Pencil, Plus, Trash2, CheckCircle2, Shield,
  ToggleLeft, ToggleRight,
} from 'lucide-react'
import toast from 'react-hot-toast'

// ── Org Profile Edit ──────────────────────────────────────────────────────────
function OrgProfileSection() {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: 'マイロスポーツクラブ',
    type: 'スポーツ教室',
    description: '子どもたちの可能性を、課外活動で広げる。安全・安心な環境で、プロのコーチが指導します。',
    email: 'info@mairo-sports.example.com',
    phone: '03-0000-0000',
    address: '東京都渋谷区〇〇1-2-3',
    website: 'https://mairo-sports.example.com',
    years_active: '5',
  })

  function handleChange(k: keyof typeof form, v: string) {
    setForm((prev) => ({ ...prev, [k]: v }))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4 text-indigo-500" />団体プロフィール
          </CardTitle>
          {!editing && <Button variant="outline" size="sm" onClick={() => setEditing(true)}><Pencil className="h-3.5 w-3.5 mr-1" />編集</Button>}
        </div>
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {([
                ['name', '団体名'],
                ['type', '種別'],
                ['email', 'メールアドレス'],
                ['phone', '電話番号'],
                ['address', '住所'],
                ['website', 'Webサイト'],
                ['years_active', '活動年数（年）'],
              ] as [keyof typeof form, string][]).map(([key, label]) => (
                <div key={key}>
                  <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                  <input value={form[key]} onChange={(e) => handleChange(key, e.target.value)}
                    className="w-full h-9 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              ))}
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">理念・説明</label>
              <textarea value={form.description} onChange={(e) => handleChange('description', e.target.value)} rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}>キャンセル</Button>
              <Button size="sm" onClick={() => { setEditing(false); toast.success('プロフィールを保存しました') }}>保存</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5 text-sm">
            {[
              ['団体名', form.name],
              ['種別', form.type],
              ['メール', form.email],
              ['電話', form.phone],
              ['住所', form.address],
              ['Webサイト', form.website],
              ['活動年数', `${form.years_active}年`],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-gray-400 w-20 shrink-0">{label}</span>
                <span className="text-gray-900">{value}</span>
              </div>
            ))}
            <div className="pt-1">
              <span className="text-gray-400 text-xs block mb-1">理念・説明</span>
              <p className="text-gray-700 text-sm leading-relaxed">{form.description}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Permissions ───────────────────────────────────────────────────────────────
const DUMMY_MEMBERS = [
  { id: 'm1', name: '田中 管理者', email: 'admin@example.com', role: 'admin' },
  { id: 'm2', name: '山田 スタッフ', email: 'staff1@example.com', role: 'staff' },
  { id: 'm3', name: '鈴木 インストラクター', email: 'inst1@example.com', role: 'instructor' },
]

function PermissionsSection() {
  const [members, setMembers] = useState(DUMMY_MEMBERS)
  const [adding, setAdding] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState('staff')

  const ROLE_LABELS: Record<string, string> = { admin: '管理者', staff: 'スタッフ', instructor: '指導者' }
  const ROLE_COLORS: Record<string, string> = { admin: 'bg-purple-100 text-purple-700', staff: 'bg-blue-100 text-blue-700', instructor: 'bg-green-100 text-green-700' }

  function inviteMember() {
    if (!newEmail.trim()) return
    setMembers((prev) => [...prev, { id: `m${Date.now()}`, name: newEmail.split('@')[0], email: newEmail, role: newRole }])
    setNewEmail(''); setNewRole('staff'); setAdding(false)
    toast.success('招待メールを送信しました')
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-purple-500" />権限管理</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setAdding(true)}><Plus className="h-3.5 w-3.5 mr-1" />招待</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {members.map((m) => (
          <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
            <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-semibold text-indigo-600 shrink-0">{m.name[0]}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{m.name}</p>
              <p className="text-xs text-gray-400 truncate">{m.email}</p>
            </div>
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', ROLE_COLORS[m.role])}>{ROLE_LABELS[m.role]}</span>
            {m.role !== 'admin' && (
              <button onClick={() => setMembers((prev) => prev.filter((x) => x.id !== m.id))} className="text-red-400 hover:text-red-600 p-1"><Trash2 className="h-3.5 w-3.5" /></button>
            )}
          </div>
        ))}
        {adding && (
          <div className="border border-dashed border-indigo-300 rounded-xl p-3 space-y-2 mt-2">
            <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="メールアドレス" className="w-full h-8 border border-gray-300 rounded-md px-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="w-full h-8 border border-gray-300 rounded-md px-2 text-sm">
              <option value="admin">管理者</option>
              <option value="staff">スタッフ</option>
              <option value="instructor">指導者</option>
            </select>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setAdding(false)}>キャンセル</Button>
              <Button size="sm" onClick={inviteMember}>招待送信</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Payment Settings ──────────────────────────────────────────────────────────
function PaymentSection() {
  const [method, setMethod] = useState<'card' | 'bank'>('card')

  return (
    <Card>
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-4 w-4 text-green-500" />決済設定</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {(['card', 'bank'] as const).map((m) => (
            <button key={m} onClick={() => setMethod(m)}
              className={cn('p-3 rounded-xl border-2 text-sm font-medium transition-all', method === m ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-gray-300')}>
              {m === 'card' ? '💳 クレジットカード' : '🏦 銀行振込'}
            </button>
          ))}
        </div>
        {method === 'card' && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500">Stripe経由で安全に決済処理</p>
            <Button variant="outline" size="sm" className="w-full" onClick={() => toast('Stripe接続設定は近日公開予定です', { icon: '🚀' })}>Stripeアカウントを連携</Button>
          </div>
        )}
        {method === 'bank' && (
          <div className="space-y-2 text-sm">
            <div className="p-3 bg-gray-50 rounded-lg space-y-1">
              <p className="text-gray-600">銀行名: <span className="font-medium text-gray-900">○○銀行</span></p>
              <p className="text-gray-600">口座番号: <span className="font-medium text-gray-900">1234567</span></p>
              <p className="text-gray-600">口座名義: <span className="font-medium text-gray-900">マイロスポーツクラブ</span></p>
            </div>
            <Button variant="outline" size="sm" className="w-full" onClick={() => toast.success('口座情報を更新しました')}>口座情報を更新</Button>
          </div>
        )}
        <div className="border-t border-gray-100 pt-3">
          <p className="text-xs text-gray-500 mb-2">領収書設定</p>
          <Button variant="outline" size="sm" onClick={() => toast('領収書発行機能は近日公開予定です', { icon: '🧾' })}>領収書テンプレートを設定</Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Notification Settings ─────────────────────────────────────────────────────
function NotificationSection() {
  const [settings, setSettings] = useState([
    { id: 'new_booking', label: '新規予約', desc: '新しい予約が入ったとき', on: true },
    { id: 'cancel', label: 'キャンセル', desc: '予約がキャンセルされたとき', on: true },
    { id: 'review', label: 'レビュー投稿', desc: 'レビューが投稿されたとき', on: true },
    { id: 'payment', label: '入金確認', desc: '支払いが完了したとき', on: false },
    { id: 'inquiry', label: '問い合わせ', desc: 'お問い合わせが届いたとき', on: true },
  ])

  function toggle(id: string) {
    setSettings((prev) => prev.map((s) => s.id === id ? { ...s, on: !s.on } : s))
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4 text-orange-500" />通知設定</CardTitle></CardHeader>
      <CardContent className="space-y-1">
        {settings.map((s) => (
          <div key={s.id} className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors">
            <div>
              <p className="text-sm font-medium text-gray-900">{s.label}</p>
              <p className="text-xs text-gray-400">{s.desc}</p>
            </div>
            <button onClick={() => toggle(s.id)}>
              {s.on
                ? <ToggleRight className="h-7 w-7 text-indigo-600" />
                : <ToggleLeft className="h-7 w-7 text-gray-300" />}
            </button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function OrgProfilePage() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">設定・プロフィール</h1>
        <p className="text-gray-500 mt-1">団体情報・権限・決済・通知の管理</p>
      </div>

      <OrgProfileSection />
      <PermissionsSection />
      <PaymentSection />
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
