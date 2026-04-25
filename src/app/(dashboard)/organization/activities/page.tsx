'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
// DISABLED: import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { ActivityForm } from '@/components/organization/activity-form'
import {
  Plus, Pencil, Trash2, ChevronLeft, ChevronRight, AlertCircle,
  Tag, Star, MapPin, Settings2, Building2, Hash,
} from 'lucide-react'
import type { Activity, ActivityStatus } from '@/types/database'

const STATUS_LABELS: Record<ActivityStatus, string> = {
  draft: '下書き', published: '公開中', cancelled: 'キャンセル', completed: '完了',
}
const STATUS_COLORS: Record<ActivityStatus, string> = {
  draft: 'bg-gray-100 text-gray-700', published: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700', completed: 'bg-blue-100 text-blue-700',
}
const TABS: { label: string; value: ActivityStatus | 'all' }[] = [
  { label: 'すべて', value: 'all' }, { label: '公開中', value: 'published' },
  { label: '下書き', value: 'draft' }, { label: 'キャンセル', value: 'cancelled' },
]
const PAGE_SIZE = 10

// ── Booking condition types ───────────────────────────────────────────────────
type BookingConditionType = 'first_come' | 'lottery' | 'condition' | 'manual'
const BOOKING_CONDITION_LABELS: Record<BookingConditionType, string> = {
  first_come: '先着自動承認', lottery: '締切後自動抽選', condition: '条件適合承認', manual: '手動承認',
}
const BOOKING_CONDITION_DESC: Record<BookingConditionType, string> = {
  first_come: '定員に達するまで申込順に自動承認',
  lottery: '締切後に申込者の中から抽選で承認',
  condition: '指定条件を満たした申込者を自動承認',
  manual: '管理者が個別に承認・却下を判断',
}

// ── Branch dummy data ─────────────────────────────────────────────────────────
const DUMMY_BRANCHES = [
  { id: 'br-001', name: '東京本部校', location: '東京都渋谷区' },
  { id: 'br-002', name: '大阪校', location: '大阪府大阪市' },
  { id: 'br-003', name: '名古屋校', location: '愛知県名古屋市' },
]

// ── Org profile panel ─────────────────────────────────────────────────────────
function OrgProfilePanel({ orgId }: { orgId: string }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('マイロスポーツクラブ')
  const [desc, setDesc] = useState('子どもたちの可能性を、課外活動で広げる。')

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-4 w-4 text-indigo-500" />企業・団体紹介
        </CardTitle>
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">団体名</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full h-9 border border-gray-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">理念・説明</label>
              <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}>キャンセル</Button>
              <Button size="sm" onClick={() => setEditing(false)}>保存</Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-gray-900">{name}</p>
              <p className="text-sm text-gray-500 mt-1">{desc}</p>
              <p className="text-xs text-gray-400 mt-1.5">ID: {orgId.slice(0, 8)}...</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}><Pencil className="h-3.5 w-3.5 mr-1" />編集</Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Branch manager ────────────────────────────────────────────────────────────
function BranchManager() {
  const [branches, setBranches] = useState(DUMMY_BRANCHES)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newLoc, setNewLoc] = useState('')

  function addBranch() {
    if (!newName.trim()) return
    const id = `br-${String(Date.now()).slice(-5)}`
    setBranches((prev) => [...prev, { id, name: newName, location: newLoc }])
    setNewName(''); setNewLoc(''); setAdding(false)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4 text-indigo-500" />店舗・拠点管理</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setAdding(true)}><Plus className="h-3.5 w-3.5 mr-1" />追加</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {branches.map((b) => (
          <div key={b.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50">
            <div>
              <p className="text-sm font-medium text-gray-800">{b.name}</p>
              <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin className="h-3 w-3" />{b.location}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-mono"><Hash className="h-3 w-3 inline" />{b.id}</span>
              <button onClick={() => setBranches((prev) => prev.filter((x) => x.id !== b.id))} className="text-red-400 hover:text-red-600 p-1"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
        {adding && (
          <div className="border border-dashed border-indigo-300 rounded-lg p-3 space-y-2">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="店舗名" className="w-full h-8 border border-gray-300 rounded-md px-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <input value={newLoc} onChange={(e) => setNewLoc(e.target.value)} placeholder="住所・エリア" className="w-full h-8 border border-gray-300 rounded-md px-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setAdding(false)}>キャンセル</Button>
              <Button size="sm" onClick={addBranch}>追加</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Booking condition panel ───────────────────────────────────────────────────
function BookingConditionPanel() {
  const [selected, setSelected] = useState<BookingConditionType>('first_come')

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2"><Settings2 className="h-4 w-4 text-indigo-500" />予約確定条件設定</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {(Object.entries(BOOKING_CONDITION_LABELS) as [BookingConditionType, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSelected(key)}
            className={`text-left p-3 rounded-xl border-2 transition-all ${selected === key ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <p className="text-sm font-semibold text-gray-900">{label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{BOOKING_CONDITION_DESC[key]}</p>
          </button>
        ))}
      </CardContent>
    </Card>
  )
}

// ── Appeal + Tags panel ───────────────────────────────────────────────────────
function AppealTagsPanel() {
  const [appeals, setAppeals] = useState(['経験豊富なコーチ陣', '少人数制で丁寧な指導', '全国大会実績あり'])
  const [tags, setTags] = useState(['スポーツ', '体力づくり', '初心者歓迎', 'チームワーク', '継続参加可'])

  function updateAppeal(i: number, v: string) {
    setAppeals((prev) => prev.map((a, idx) => idx === i ? v : a))
  }
  function updateTag(i: number, v: string) {
    setTags((prev) => prev.map((t, idx) => idx === i ? v : t))
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2"><Star className="h-4 w-4 text-yellow-500" />アピールポイント・タグ設定</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1"><Star className="h-3.5 w-3.5 text-yellow-400" />アピールポイント（3つ）</p>
          <div className="space-y-2">
            {appeals.map((a, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-4">{i + 1}.</span>
                <input value={a} onChange={(e) => updateAppeal(i, e.target.value)} className="flex-1 h-8 border border-gray-300 rounded-md px-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1"><Tag className="h-3.5 w-3.5 text-indigo-400" />特徴タグ（5つ）</p>
          <div className="flex flex-wrap gap-2">
            {tags.map((t, i) => (
              <input key={i} value={t} onChange={(e) => updateTag(i, e.target.value)} className="h-7 border border-indigo-200 rounded-full px-3 text-xs bg-indigo-50 text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-28" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface ActivityWithBookings extends Activity {
  _bookingCount: number
}

export default function OrgActivitiesPage() {
  const { user } = useAuthStore()
  const [activities, setActivities] = useState<ActivityWithBookings[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<ActivityStatus | 'all'>('all')
  const [page, setPage] = useState(1)
  const [orgId, setOrgId] = useState<string | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [editActivity, setEditActivity] = useState<Activity | null>(null)
  const [deleteActivity, setDeleteActivity] = useState<Activity | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Resolve org
  useEffect(() => {
    if (!user) return
    // DISABLED (Supabase): const supabase = createClient()
    // DISABLED (Supabase): supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) setOrgId((data as unknown as { organization_id: string }).organization_id)
      })
  }, [user])

  useEffect(() => {
    if (!orgId) return
    loadActivities()
  }, [orgId, statusFilter, page])

  async function loadActivities() {
    if (!orgId) return
    setLoading(true)
    // DISABLED (Supabase): const supabase = createClient()
    // DISABLED (Supabase): let query = supabase
      .from('activities')
      .select('*', { count: 'exact' })
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const { data, count, error } = await query
    if (!error && data) {
      // Fetch booking counts per activity
      const ids = data.map((a: Activity) => a.id)
      // DISABLED (Supabase): const { data: bookingCounts } = await supabase
        .from('bookings')
        .select('activity_schedules!inner(activity_id)')
        .in('activity_schedules.activity_id', ids)

      const countMap: Record<string, number> = {}
      for (const b of (bookingCounts ?? []) as any[]) {
        const aid = b.activity_schedules?.activity_id
        if (aid) countMap[aid] = (countMap[aid] ?? 0) + 1
      }

      setActivities(
        data.map((a: Activity) => ({ ...a, _bookingCount: countMap[a.id] ?? 0 }))
      )
      setTotal(count ?? 0)
    }
    setLoading(false)
  }

  async function handleDelete() {
    if (!deleteActivity) return
    setDeleting(true)
    setDeleteError('')
    // DISABLED (Supabase): const supabase = createClient()
    // DISABLED (Supabase): const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', deleteActivity.id)

    if (error) {
      setDeleteError(error.message)
    } else {
      setDeleteActivity(null)
      loadActivities()
    }
    setDeleting(false)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">アクティビティ管理</h1>
          <p className="text-sm text-gray-500 mt-1">アクティビティの作成・編集・管理</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          アクティビティ作成
        </Button>
      </div>

      {/* ── 企業・団体紹介 */}
      {orgId && <OrgProfilePanel orgId={orgId} />}

      {/* ── 店舗・拠点管理 */}
      <BranchManager />

      {/* ── 予約確定条件 */}
      <BookingConditionPanel />

      {/* ── アピールポイント・タグ */}
      <AppealTagsPanel />
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1) }}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              statusFilter === tab.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin h-6 w-6 rounded-full border-2 border-indigo-600 border-t-transparent" />
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <AlertCircle className="h-10 w-10 mb-2 opacity-40" />
              <p className="text-sm">アクティビティが見つかりません</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left px-6 py-3 font-semibold text-gray-600">タイトル</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">カテゴリ</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">ステータス</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">価格</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">予約数</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">作成日</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {activities.map((activity) => (
                      <tr key={activity.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {activity.image_url && (
                              <img
                                src={activity.image_url}
                                alt={activity.title}
                                className="h-8 w-8 rounded-md object-cover shrink-0"
                              />
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate max-w-[200px]">
                                {activity.title}
                              </p>
                              {activity.location && (
                                <p className="text-xs text-gray-500 truncate max-w-[200px]">
                                  {activity.location}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-gray-600">{activity.category}</td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              STATUS_COLORS[activity.status]
                            }`}
                          >
                            {STATUS_LABELS[activity.status]}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right font-medium text-gray-900">
                          {formatCurrency(activity.price)}
                        </td>
                        <td className="px-4 py-4 text-right text-gray-700">
                          {activity._bookingCount}
                        </td>
                        <td className="px-4 py-4 text-right text-gray-500">
                          {formatDate(activity.created_at)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setEditActivity(activity)}
                              aria-label="編集"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setDeleteActivity(activity)}
                              aria-label="削除"
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    {total}件中 {(page - 1) * PAGE_SIZE + 1}〜
                    {Math.min(page * PAGE_SIZE, total)}件を表示
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                      .reduce<(number | 'ellipsis')[]>((acc, p, i, arr) => {
                        if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('ellipsis')
                        acc.push(p)
                        return acc
                      }, [])
                      .map((item, i) =>
                        item === 'ellipsis' ? (
                          <span key={`e${i}`} className="px-2 text-gray-400">
                            …
                          </span>
                        ) : (
                          <Button
                            key={item}
                            variant={page === item ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPage(item as number)}
                            className="min-w-[36px]"
                          >
                            {item}
                          </Button>
                        )
                      )}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      {orgId && (
        <Modal
          open={createOpen}
          onOpenChange={setCreateOpen}
          title="アクティビティを作成"
          className="max-w-2xl"
        >
          <ActivityForm
            organizationId={orgId}
            onSuccess={() => { setCreateOpen(false); loadActivities() }}
            onCancel={() => setCreateOpen(false)}
          />
        </Modal>
      )}

      {/* Edit Modal */}
      {editActivity && orgId && (
        <Modal
          open={!!editActivity}
          onOpenChange={(open) => { if (!open) setEditActivity(null) }}
          title="アクティビティを編集"
          className="max-w-2xl"
        >
          <ActivityForm
            organizationId={orgId}
            activity={editActivity}
            onSuccess={() => { setEditActivity(null); loadActivities() }}
            onCancel={() => setEditActivity(null)}
          />
        </Modal>
      )}

      {/* Delete confirmation */}
      <Modal
        open={!!deleteActivity}
        onOpenChange={(open) => { if (!open) setDeleteActivity(null) }}
        title="アクティビティを削除"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            <strong className="font-semibold">{deleteActivity?.title}</strong>{' '}
            を削除しますか？この操作は元に戻せません。
          </p>
          {deleteError && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {deleteError}
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteActivity(null)} disabled={deleting}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={handleDelete} isLoading={deleting}>
              削除する
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
