'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import QRCode from 'react-qr-code'
import {
  Camera, Mail, Shield, BarChart3, Download,
  Star, TrendingUp, Receipt, CreditCard, HelpCircle, ScrollText, ChevronRight,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/stores/auth-store'
import { useBookings } from '@/hooks/use-bookings'
import { useReflections } from '@/hooks/use-reflections'
import { getInitials, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { ProfileUpdate } from '@/types/database'

// ── レベル定義 ──────────────────────────────────────────────
const LEVELS = [
  { level: 1, label: 'はじめの一歩', minActivities: 0 },
  { level: 2, label: '好奇心の芽', minActivities: 2 },
  { level: 3, label: '動き出した風', minActivities: 5 },
  { level: 4, label: '挑戦の炎', minActivities: 8 },
  { level: 5, label: '努力の地図', minActivities: 12 },
  { level: 6, label: '成長の証', minActivities: 17 },
  { level: 7, label: '自分を超える者', minActivities: 23 },
  { level: 8, label: '光を灯す者', minActivities: 30 },
  { level: 9, label: '創る人', minActivities: 38 },
  { level: 10, label: '道を拓く者', minActivities: 47 },
  { level: 11, label: '伝える人', minActivities: 57 },
  { level: 12, label: '未来の礎', minActivities: 68 },
  { level: 13, label: 'mairo Legend', minActivities: 80 },
]

function getUserLevel(completedCount: number) {
  let current = LEVELS[0]
  for (const lvl of LEVELS) {
    if (completedCount >= lvl.minActivities) current = lvl
  }
  const nextIdx = LEVELS.indexOf(current) + 1
  const next = LEVELS[nextIdx] ?? null
  const progress = next
    ? Math.round(((completedCount - current.minActivities) / (next.minActivities - current.minActivities)) * 100)
    : 100
  return { ...current, next, progress }
}

interface ProfileFormValues {
  name: string
  bio: string
}

const ROLE_LABELS: Record<string, { label: string; variant: any }> = {
  general: { label: '一般ユーザー', variant: 'secondary' },
  instructor: { label: 'インストラクター', variant: 'info' },
  organization_admin: { label: '組織管理者', variant: 'default' },
}

export default function ProfilePage() {
  const { user, roles, setUser } = useAuthStore()
  const { data: bookings } = useBookings()
  const { data: reflections } = useReflections()

  const [saving, setSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [qrData, setQrData] = useState<string | null>(null)
  const [qrLoading, setQrLoading] = useState(true)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    defaultValues: {
      name: user?.name ?? '',
      bio: user?.bio ?? '',
    },
  })

  useEffect(() => {
    if (user) {
      reset({ name: user.name, bio: user.bio ?? '' })
    }
  }, [user, reset])

  // QR (ローカル生成のみ)
  useEffect(() => {
    if (!user) return
    const qrValue = `mairo:user:${user.id}`
    setQrData(qrValue)
    setQrLoading(false)
  }, [user])

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) return
    setSaving(true)
    try {
      const updates: ProfileUpdate = {
        name: values.name,
        bio: values.bio || null,
      }
      setUser({ ...user, ...updates })
      reset(values)
      toast.success('プロフィールを更新しました（ローカル）')
    } catch {
      toast.error('更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    if (!file.type.startsWith('image/')) {
      toast.error('画像ファイルを選択してください')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('5MB以下のファイルを選択してください')
      return
    }

    setAvatarUploading(true)
    try {
      const localUrl = URL.createObjectURL(file)
      setUser({ ...user, avatar_url: localUrl })
      toast.success('アバターを更新しました（ローカル）')
    } catch {
      toast.error('アップロードに失敗しました')
    } finally {
      setAvatarUploading(false)
    }
  }

  const completedActivities = (bookings ?? []).filter((b) => b.status === 'completed').length
  const upcomingActivities = (bookings ?? []).filter(
    (b) => b.status === 'reserved' && new Date(b.activity_schedule.date_time) > new Date()
  ).length
  const reflectionCount = reflections?.length ?? 0
  const analyzedCount = (reflections ?? []).filter(
    (r) => r.ai_analysis?.status === 'completed'
  ).length

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">プロフィール</h1>
        <p className="text-gray-500 mt-1">アカウント情報の確認と編集</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="h-20 w-20 rounded-full overflow-hidden bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} className="h-full w-full object-cover" />
                    ) : (
                      getInitials(user.name)
                    )}
                  </div>
                </div>
                <div>
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <Button onClick={() => avatarInputRef.current?.click()}>
                    写真変更
                  </Button>
                  <input ref={avatarInputRef} type="file" className="hidden" onChange={handleAvatarChange} />
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input label="名前" {...register('name')} />
                <Textarea label="自己紹介" {...register('bio')} />
                <Button type="submit" disabled={!isDirty || saving}>
                  保存
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ロール</CardTitle>
            </CardHeader>
            <CardContent>
              {roles.map((r) => (
                <Badge key={r.id}>{ROLE_LABELS[r.role_type]?.label}</Badge>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>統計</CardTitle>
            </CardHeader>
            <CardContent>
              <p>参加済: {completedActivities}</p>
              <p>予約中: {upcomingActivities}</p>
              <p>振り返り: {reflectionCount}</p>
              <p>AI分析: {analyzedCount}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>QRコード</CardTitle>
            </CardHeader>
            <CardContent>
              {qrLoading ? <Skeleton className="h-40" /> : <QRCode value={qrData!} />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>アカウント</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{formatDate(user.created_at)}</p>
            </CardContent>
          </Card>

          {/* ── ユーザーレベル ─────────────────────────────── */}
          {(() => {
            const lvl = getUserLevel(completedActivities)
            return (
              <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-400" />
                    ユーザーレベル
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-lg font-bold text-indigo-700">Lv.{lvl.level}　{lvl.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">参加 {completedActivities} 回</p>
                  </div>
                  <div className="w-full bg-white rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all"
                      style={{ width: `${lvl.progress}%` }}
                    />
                  </div>
                  {lvl.next && (
                    <p className="text-xs text-gray-400">
                      次: Lv.{lvl.next.level}「{lvl.next.label}」まで {lvl.next.minActivities - completedActivities} 回
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })()}

          {/* ── 課外活動レポートPDF ────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-500" />
                課外活動レポート
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-gray-500">
                AI Analystがあなたの活動履歴・振り返りを分析し、PDFレポートを生成します。
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => toast('レポート生成機能は近日公開予定です！', { icon: '🚀' })}
              >
                <Download className="h-4 w-4 mr-2" />
                PDFレポートを生成
              </Button>
            </CardContent>
          </Card>

          {/* ── 決済・領収書 ───────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-indigo-500" />
                お支払い
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <button
                onClick={() => toast('決済機能は近日公開予定です！', { icon: '💳' })}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700"
              >
                <span className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-gray-400" />支払い方法の管理</span>
                <ChevronRight className="h-4 w-4 text-gray-300" />
              </button>
              <button
                onClick={() => toast('領収書機能は近日公開予定です！', { icon: '🧾' })}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700"
              >
                <span className="flex items-center gap-2"><Receipt className="h-4 w-4 text-gray-400" />領収書一覧</span>
                <ChevronRight className="h-4 w-4 text-gray-300" />
              </button>
            </CardContent>
          </Card>

          {/* ── その他 ──────────────────────────────────────── */}
          <Card>
            <CardContent className="p-2 space-y-1">
              <button
                onClick={() => toast('利用規約ページは近日公開予定です！')}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700"
              >
                <span className="flex items-center gap-2"><ScrollText className="h-4 w-4 text-gray-400" />利用規約</span>
                <ChevronRight className="h-4 w-4 text-gray-300" />
              </button>
              <button
                onClick={() => toast('お問い合わせ: support@mairo.app')}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700"
              >
                <span className="flex items-center gap-2"><HelpCircle className="h-4 w-4 text-gray-400" />お問い合わせ</span>
                <ChevronRight className="h-4 w-4 text-gray-300" />
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
