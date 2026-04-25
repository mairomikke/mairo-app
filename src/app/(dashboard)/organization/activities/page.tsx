'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
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

// ── ダミーデータ ─────────────────────────────────────────
function generateDummyActivities(): (Activity & { _bookingCount: number })[] {
  return [
    {
      id: 'a1',
      title: 'サッカー教室',
      category: 'sports',
      status: 'published',
      price: 2000,
      created_at: new Date().toISOString(),
      organization_id: 'org-1',
      location: '渋谷',
      image_url: '',
      description: '',
      _bookingCount: 12,
    } as any,
    {
      id: 'a2',
      title: '英会話クラス',
      category: 'language',
      status: 'draft',
      price: 1500,
      created_at: new Date().toISOString(),
      organization_id: 'org-1',
      location: '新宿',
      image_url: '',
      description: '',
      _bookingCount: 5,
    } as any,
  ]
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
  const [orgId, setOrgId] = useState<string | null>('org-1')

  const [createOpen, setCreateOpen] = useState(false)
  const [editActivity, setEditActivity] = useState<Activity | null>(null)
  const [deleteActivity, setDeleteActivity] = useState<Activity | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    loadActivities()
  }, [statusFilter, page])

  function loadActivities() {
    setLoading(true)

    const all = generateDummyActivities()

    const filtered =
      statusFilter === 'all'
        ? all
        : all.filter((a) => a.status === statusFilter)

    const paginated = filtered.slice(
      (page - 1) * PAGE_SIZE,
      page * PAGE_SIZE
    )

    setActivities(paginated)
    setTotal(filtered.length)

    setLoading(false)
  }

  function handleDelete() {
    if (!deleteActivity) return
    setDeleting(true)
    setDeleteError('')

    setActivities((prev) =>
      prev.filter((a) => a.id !== deleteActivity.id)
    )

    setDeleteActivity(null)
    setDeleting(false)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
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

      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1) }}
            className={`px-4 py-1.5 rounded-md text-sm font-medium ${
              statusFilter === tab.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="h-48 flex items-center justify-center">Loading...</div>
          ) : (
            <div className="divide-y">
              {activities.map((a) => (
                <div key={a.id} className="p-4 flex justify-between">
                  <div>
                    <p className="font-semibold">{a.title}</p>
                    <p className="text-xs text-gray-500">{a.category}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" onClick={() => setEditActivity(a)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" onClick={() => setDeleteActivity(a)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={!!deleteActivity} onOpenChange={() => setDeleteActivity(null)} title="削除確認">
        <div className="space-y-4">
          <p>{deleteActivity?.title} を削除しますか？</p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteActivity(null)}>
              キャンセル
            </Button>
            <Button onClick={handleDelete}>
              削除
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}