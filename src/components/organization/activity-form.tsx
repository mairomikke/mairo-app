'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateActivity, useUpdateActivity } from '@/hooks/use-activities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { X, Plus, AlertCircle } from 'lucide-react'
import type { Activity, ActivityStatus } from '@/types/database'

// ── Schema ────────────────────────────────────────────────────────────────────

const activitySchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').max(100, '100文字以内で入力してください'),
  description: z.string().max(2000, '2000文字以内で入力してください').optional(),
  category: z.string().min(1, 'カテゴリは必須です'),
  price: z
    .number()
    .min(0, '0以上の金額を入力してください')
    .max(1_000_000),
  capacity: z
    .number()
    .int()
    .min(1, '1名以上の定員を設定してください')
    .max(1000),
  location: z.string().max(200).optional(),
  status: z.enum(['draft', 'published', 'cancelled', 'completed'] as const),
  image_url: z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
})

type ActivityFormValues = z.infer<typeof activitySchema>

// ── Categories ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: 'sports', label: 'スポーツ' },
  { value: 'music', label: '音楽' },
  { value: 'art', label: 'アート' },
  { value: 'cooking', label: '料理' },
  { value: 'language', label: '語学' },
  { value: 'dance', label: 'ダンス' },
  { value: 'fitness', label: 'フィットネス' },
  { value: 'yoga', label: 'ヨガ' },
  { value: 'technology', label: 'テクノロジー' },
  { value: 'nature', label: '自然・アウトドア' },
  { value: 'other', label: 'その他' },
]

const STATUS_OPTIONS: { value: ActivityStatus; label: string }[] = [
  { value: 'draft', label: '下書き' },
  { value: 'published', label: '公開中' },
  { value: 'cancelled', label: 'キャンセル' },
  { value: 'completed', label: '完了' },
]

// ── Props ─────────────────────────────────────────────────────────────────────

interface ActivityFormProps {
  organizationId: string
  activity?: Activity
  onSuccess: () => void
  onCancel: () => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ActivityForm({ organizationId, activity, onSuccess, onCancel }: ActivityFormProps) {
  const createActivity = useCreateActivity()
  const updateActivity = useUpdateActivity()

  const isEditing = !!activity

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ActivityFormValues>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      title: activity?.title ?? '',
      description: activity?.description ?? '',
      category: activity?.category ?? '',
      price: activity?.price ?? 0,
      capacity: activity?.capacity ?? 10,
      location: activity?.location ?? '',
      status: activity?.status ?? 'draft',
      image_url: activity?.image_url ?? '',
    },
  })

  // Tags state
  const [tags, setTags] = useState<string[]>(activity?.tags ?? [])
  const [tagInput, setTagInput] = useState('')

  // Appeal points (up to 3)
  const [appealPoints, setAppealPoints] = useState<string[]>(
    activity?.appeal_points?.length ? activity.appeal_points : ['', '', '']
  )

  const [serverError, setServerError] = useState('')

  function addTag() {
    const t = tagInput.trim()
    if (t && !tags.includes(t) && tags.length < 10) {
      setTags((prev) => [...prev, t])
    }
    setTagInput('')
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag))
  }

  function updateAppealPoint(index: number, value: string) {
    setAppealPoints((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  async function onSubmit(values: ActivityFormValues) {
    setServerError('')
    const payload = {
      ...values,
      organization_id: organizationId,
      description: values.description || null,
      location: values.location || null,
      image_url: values.image_url || null,
      tags,
      appeal_points: appealPoints.filter(Boolean),
    }

    try {
      if (isEditing && activity) {
        await updateActivity.mutateAsync({
          id: activity.id,
          updates: {
            title: payload.title,
            description: payload.description,
            category: payload.category,
            price: payload.price,
            capacity: payload.capacity,
            location: payload.location,
            tags: payload.tags,
            appeal_points: payload.appeal_points,
            status: payload.status,
            image_url: payload.image_url,
          },
        })
      } else {
        await createActivity.mutateAsync(payload as any)
      }
      onSuccess()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : '送信エラーが発生しました')
    }
  }

  const selectedCategory = watch('category')
  const selectedStatus = watch('status')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {serverError && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3 border border-red-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {serverError}
        </div>
      )}

      {/* Title */}
      <Input
        id="title"
        label="タイトル"
        placeholder="例：初心者向けヨガクラス"
        error={errors.title?.message}
        {...register('title')}
      />

      {/* Description */}
      <Textarea
        id="description"
        label="説明"
        placeholder="アクティビティの詳細を入力してください..."
        rows={4}
        {...register('description')}
      />

      {/* Category & Status row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            カテゴリ <span className="text-red-500">*</span>
          </label>
          <Select
            value={selectedCategory}
            onValueChange={(v) => setValue('category', v, { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="カテゴリを選択" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="mt-1.5 text-xs text-red-600">{errors.category.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">ステータス</label>
          <Select
            value={selectedStatus}
            onValueChange={(v) => setValue('status', v as ActivityStatus, { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Price & Capacity row */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          id="price"
          label="価格（円）"
          type="number"
          min={0}
          placeholder="5000"
          error={errors.price?.message}
          {...register('price', { valueAsNumber: true })}
        />
        <Input
          id="capacity"
          label="定員（名）"
          type="number"
          min={1}
          placeholder="20"
          error={errors.capacity?.message}
          {...register('capacity', { valueAsNumber: true })}
        />
      </div>

      {/* Location */}
      <Input
        id="location"
        label="場所"
        placeholder="例：東京都渋谷区..."
        {...register('location')}
      />

      {/* Image URL */}
      <Input
        id="image_url"
        label="画像URL"
        type="url"
        placeholder="https://example.com/image.jpg"
        error={errors.image_url?.message}
        {...register('image_url')}
      />

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">タグ</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-indigo-900 focus:outline-none"
                aria-label={`タグ「${tag}」を削除`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); addTag() }
            }}
            placeholder="タグを追加..."
            className="flex-1"
          />
          <Button type="button" variant="outline" onClick={addTag} disabled={!tagInput.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-1">Enterキーまたは追加ボタンでタグを追加（最大10個）</p>
      </div>

      {/* Appeal points */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          アピールポイント（最大3つ）
        </label>
        <div className="space-y-2">
          {[0, 1, 2].map((idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                {idx + 1}
              </span>
              <input
                value={appealPoints[idx] ?? ''}
                onChange={(e) => updateAppealPoint(idx, e.target.value)}
                placeholder={`アピールポイント ${idx + 1}`}
                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-transparent"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          キャンセル
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {isEditing ? '更新する' : '作成する'}
        </Button>
      </div>
    </form>
  )
}
