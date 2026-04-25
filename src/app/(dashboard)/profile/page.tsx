'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import QRCode from 'react-qr-code'
import {
  Camera, User, Mail, FileText, Shield, BarChart3, Download, AlertCircle, CheckCircle2,
  Star, TrendingUp, Receipt, CreditCard, HelpCircle, ScrollText, ChevronRight,
} from 'lucide-react'
import toast from 'react-hot-toast'
// DISABLED: import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { useBookings } from '@/hooks/use-bookings'
import { useReflections } from '@/hooks/use-reflections'
import { cn, getInitials, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { ProfileUpdate } from '@/types/database'

// ── レベル定義 ──────────────────────────────────────────────
const LEVELS = [
  { level: 1,  label: 'はじめの一歩',   minActivities: 0  },
  { level: 2,  label: '好奇心の芽',     minActivities: 2  },
  { level: 3,  label: '動き出した風',   minActivities: 5  },
  { level: 4,  label: '挑戦の炎',       minActivities: 8  },
  { level: 5,  label: '努力の地図',     minActivities: 12 },
  { level: 6,  label: '成長の証',       minActivities: 17 },
  { level: 7,  label: '自分を超える者', minActivities: 23 },
  { level: 8,  label: '光を灯す者',     minActivities: 30 },
  { level: 9,  label: '創る人',         minActivities: 38 },
  { level: 10, label: '道を拓く者',     minActivities: 47 },
  { level: 11, label: '伝える人',       minActivities: 57 },
  { level: 12, label: '未来の礎',       minActivities: 68 },
  { level: 13, label: 'mairo Legend',   minActivities: 80 },
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

const ROLE_LABELS: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'info' | 'secondary' | 'danger' }> = {
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

  // Reset form when user data loads
  useEffect(() => {
    if (user) {
      reset({ name: user.name, bio: user.bio ?? '' })
    }
  }, [user, reset])

  // Load or create QR code
  useEffect(() => {
    async function loadQR() {
      if (!user) return
      // DISABLED (Supabase): const supabase = createClient()
      // DISABLED (Supabase): const { data: qrRow } = await supabase
        .from('qr_auth')
        .select('qr_data')
        .eq('user_id', user.id)
        .single()

      const existingQr = (qrRow as { qr_data?: string } | null)?.qr_data
      if (existingQr) {
        setQrData(existingQr)
      } else {
        // Create QR data
        const qrValue = `mairo:user:${user.id}:${Date.now()}`
        // DISABLED (Supabase): const { data: insertedRow } = await supabase
          .from('qr_auth')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .upsert({ user_id: user.id, qr_data: qrValue } as any, { onConflict: 'user_id' })
          .select('qr_data')
          .single()
        const insertedQr = (insertedRow as { qr_data?: string } | null)?.qr_data
        setQrData(insertedQr ?? qrValue)
      }
      setQrLoading(false)
    }
    loadQR()
  }, [user])

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) return
    setSaving(true)
    try {
      // DISABLED (Supabase): const supabase = createClient()
      const updates: ProfileUpdate = {
        name: values.name,
        bio: values.bio || null,
      }
      // DISABLED (Supabase): const { data, error } = await supabase
        .from('profiles')
        .update(updates as never)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      setUser(data as typeof user)
      reset({ name: values.name, bio: values.bio })
      toast.success('プロフィールを更新しました')
    } catch (err) {
      toast.error('更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // Validate file
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
      // DISABLED (Supabase): const supabase = createClient()
      const ext = file.name.split('.').pop()
      const path = `avatars/${user.id}.${ext}`

      // DISABLED (Supabase): const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      // DISABLED (Supabase): const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(path)

      const avatarUrl = urlData.publicUrl

      // DISABLED (Supabase): await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl } as never)
        .eq('id', user.id)

      setUser({ ...user, avatar_url: avatarUrl })
      toast.success('アバターを更新しました')
    } catch (err) {
      toast.error('アップロードに失敗しました')
    } finally {
      setAvatarUploading(false)
    }
  }

  // Stats
  const completedActivities = (bookings ?? []).filter((b) => b.status === 'completed').length
  const upcomingActivities = (bookings ?? []).filter(
    (b) =>
      b.status === 'reserved' &&
      new Date(b.activity_schedule.date_time) > new Date()
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">プロフィール</h1>
        <p className="text-gray-500 mt-1">アカウント情報の確認と編集</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Avatar & Profile Edit */}
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="h-20 w-20 rounded-full overflow-hidden bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      getInitials(user.name)
                    )}
                  </div>
                  {avatarUploading && (
                    <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={avatarUploading}
                    isLoading={avatarUploading}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    写真を変更
                  </Button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label="名前"
                  id="name"
                  {...register('name', {
                    required: '名前は必須です',
                    minLength: { value: 1, message: '名前を入力してください' },
                  })}
                  error={errors.name?.message}
                  placeholder="山田 太郎"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    メールアドレス
                  </label>
                  <div className="flex h-10 w-full items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500">
                    <Mail className="h-4 w-4 mr-2 shrink-0 text-gray-400" />
                    {user.email}
                    <span className="ml-auto text-xs text-gray-400">変更不可</span>
                  </div>
                </div>
                <Textarea
                  label="自己紹介"
                  id="bio"
                  {...register('bio')}
                  placeholder="あなたについて教えてください..."
                  rows={4}
                  hint="学習スタイルや興味分野を書いてみましょう"
                />

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={!isDirty || saving}
                    isLoading={saving}
                  >
                    {saving ? '保存中...' : '変更を保存'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Roles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-indigo-500" />
                ロール
              </CardTitle>
            </CardHeader>
            <CardContent>
              {roles.length === 0 ? (
                <p className="text-sm text-gray-500">ロールが設定されていません</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {roles.map((role) => {
                    const info = ROLE_LABELS[role.role_type] ?? { label: role.role_type, variant: 'secondary' as const }
                    return (
                      <Badge key={role.id} variant={info.variant}>
                        {info.label}
                      </Badge>
                    )
                  })}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-3">
                ロールの変更はサポートまでお問い合わせください
              </p>
            </CardContent>
          </Card>

          {/* Activity Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-indigo-500" />
                アクティビティ統計
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-xl bg-indigo-50">
                  <p className="text-2xl font-bold text-indigo-700">{upcomingActivities}</p>
                  <p className="text-xs text-indigo-500 mt-1">予約中</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-green-50">
                  <p className="text-2xl font-bold text-green-700">{completedActivities}</p>
                  <p className="text-xs text-green-500 mt-1">参加済み</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-purple-50">
                  <p className="text-2xl font-bold text-purple-700">{reflectionCount}</p>
                  <p className="text-xs text-purple-500 mt-1">振り返り</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-orange-50">
                  <p className="text-2xl font-bold text-orange-700">{analyzedCount}</p>
                  <p className="text-xs text-orange-500 mt-1">AI分析完了</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* QR Code */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">マイQRコード</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {qrLoading ? (
                <Skeleton className="h-48 w-full rounded-xl" />
              ) : qrData ? (
                <>
                  <div className="flex justify-center p-4 bg-white rounded-xl border border-gray-100">
                    <QRCode
                      value={qrData}
                      size={180}
                      style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    インストラクターにスキャンしてもらいましょう
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      // Download QR code as SVG
                      const svg = document.querySelector('.qr-container svg')
                      if (!svg) return
                      const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = 'mairo-qr.svg'
                      a.click()
                      URL.revokeObjectURL(url)
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    ダウンロード
                  </Button>
                </>
              ) : (
                <div className="text-center text-gray-500 py-6">
                  <p className="text-sm">QRコードを生成できませんでした</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">アカウント情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>登録日</span>
                <span className="font-medium text-gray-900">{formatDate(user.created_at)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>最終更新</span>
                <span className="font-medium text-gray-900">{formatDate(user.updated_at)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>ユーザーID</span>
                <span className="font-mono text-xs text-gray-400 truncate max-w-[120px]">
                  {user.id.slice(0, 8)}...
                </span>
              </div>
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
