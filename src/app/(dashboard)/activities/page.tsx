'use client'

import { useState, useCallback, useRef } from 'react'
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, TrendingUp, Flame, Star } from 'lucide-react'
import { useActivities } from '@/hooks/use-activities'
import { ActivityCard } from '@/components/activity/activity-card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { cn, formatCurrency } from '@/lib/utils'
import Link from 'next/link'

const CATEGORIES = [
  { label: 'すべて', value: '' },
  { label: 'スポーツ', value: 'sports' },
  { label: 'アート', value: 'arts' },
  { label: '音楽', value: 'music' },
  { label: '学習', value: 'academic' },
  { label: 'テクノロジー', value: 'technology' },
  { label: 'アウトドア', value: 'outdoor' },
  { label: '料理', value: 'cooking' },
  { label: '語学', value: 'language' },
]

const PRICE_RANGES = [
  { label: 'すべて', minPrice: undefined, maxPrice: undefined },
  { label: '無料', minPrice: 0, maxPrice: 0 },
  { label: '¥5,000未満', minPrice: 1, maxPrice: 4999 },
  { label: '¥5,000〜¥10,000', minPrice: 5000, maxPrice: 10000 },
  { label: '¥10,000以上', minPrice: 10001, maxPrice: undefined },
]

const COMMON_TAGS = [
  '初心者歓迎',
  '子供向け',
  '大人向け',
  '少人数',
  '屋外',
  '屋内',
  '週末',
  '平日',
]

const PAGE_SIZE = 12

export default function ActivitiesPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [category, setCategory] = useState('')
  const [priceIdx, setPriceIdx] = useState(0)
  const [location, setLocation] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [filterOpen, setFilterOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // トレンド: 全件から上位取得（新着・人気はDBにカラムがないため件数で代替）
  const { data: trendActivities } = useActivities({ pageSize: 3 })
  const { data: newActivities } = useActivities({ pageSize: 3 })

  const selectedPrice = PRICE_RANGES[priceIdx]

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      setSearch(val)
      setPage(1)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => setDebouncedSearch(val), 400)
    },
    []
  )

  const { data: activities, isPending } = useActivities({
    search: debouncedSearch || undefined,
    category: category || undefined,
    minPrice: selectedPrice.minPrice,
    maxPrice: selectedPrice.maxPrice,
    location: location || undefined,
    tags: selectedTags.length > 0 ? selectedTags : undefined,
    page,
    pageSize: PAGE_SIZE,
  })

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
    setPage(1)
  }

  const clearFilters = () => {
    setSearch('')
    setDebouncedSearch('')
    setCategory('')
    setPriceIdx(0)
    setLocation('')
    setSelectedTags([])
    setPage(1)
  }

  const hasActiveFilters =
    category !== '' || priceIdx !== 0 || location !== '' || selectedTags.length > 0

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">アクティビティを探す</h1>
        <p className="text-gray-500 mt-1">あなたの成長につながる体験を見つけましょう</p>
      </div>

      {/* ── トレンド ─────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-5 w-5 text-indigo-500" />
          <h2 className="text-base font-semibold text-gray-900">トレンド</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* 人気Top3 */}
          <div className="sm:col-span-2">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Flame className="h-3.5 w-3.5 text-orange-400" /> 人気 Top 3
            </p>
            <div className="space-y-2">
              {(trendActivities ?? []).slice(0, 3).map((act, i) => (
                <Link key={act.id} href={`/activities/${act.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-3 flex items-center gap-3">
                      <span className={cn(
                        'text-lg font-bold w-7 text-center shrink-0',
                        i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : 'text-amber-600'
                      )}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{act.title}</p>
                        <p className="text-xs text-gray-400 truncate">{act.location ?? '場所未定'}</p>
                      </div>
                      <p className="text-sm font-semibold text-indigo-600 shrink-0">{formatCurrency(act.price ?? 0)}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
          {/* 新着 */}
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Star className="h-3.5 w-3.5 text-indigo-400" /> 新着
            </p>
            <div className="space-y-2">
              {(newActivities ?? []).slice(0, 3).map((act) => (
                <Link key={act.id} href={`/activities/${act.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-3">
                      <p className="text-sm font-medium text-gray-900 truncate">{act.title}</p>
                      <p className="text-xs text-indigo-500 mt-0.5">{act.category}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="アクティビティを検索..."
            value={search}
            onChange={handleSearchChange}
            className={cn(
              'flex h-10 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2 text-sm',
              'placeholder:text-gray-400',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-transparent'
            )}
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setFilterOpen(!filterOpen)}
          className={cn(filterOpen && 'bg-indigo-50 border-indigo-300')}
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          フィルター
          {hasActiveFilters && (
            <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-indigo-600 text-white rounded-full">
              !
            </span>
          )}
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filter Sidebar */}
        <aside className={cn(
          'w-full lg:w-64 shrink-0 space-y-6',
          !filterOpen && 'hidden lg:block'
        )}>
            <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-6">
              {/* Category */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">カテゴリー</h3>
                <div className="space-y-2">
                  {CATEGORIES.map((cat) => (
                    <label key={cat.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="category"
                        value={cat.value}
                        checked={category === cat.value}
                        onChange={() => {
                          setCategory(cat.value)
                          setPage(1)
                        }}
                        className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">{cat.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">価格帯</h3>
                <div className="space-y-2">
                  {PRICE_RANGES.map((range, idx) => (
                    <label key={range.label} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="price"
                        checked={priceIdx === idx}
                        onChange={() => {
                          setPriceIdx(idx)
                          setPage(1)
                        }}
                        className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">{range.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">場所</h3>
                <input
                  type="text"
                  placeholder="場所を入力..."
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value)
                    setPage(1)
                  }}
                  className={cn(
                    'flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm',
                    'placeholder:text-gray-400',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-transparent'
                  )}
                />
              </div>

              {/* Tags */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">タグ</h3>
                <div className="space-y-2">
                  {COMMON_TAGS.map((tag) => (
                    <label key={tag} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag)}
                        onChange={() => toggleTag(tag)}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">{tag}</span>
                    </label>
                  ))}
                </div>
              </div>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-1" />
                  フィルターをリセット
                </Button>
              )}
            </div>
          </aside>

        {/* Activity Grid */}
        <div className="flex-1 min-w-0">
          {isPending ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-gray-200 bg-white overflow-hidden"
                >
                  <Skeleton className="h-44 w-full rounded-none" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-4 w-16 rounded-full" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                    <div className="flex justify-between items-center pt-1">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-8 w-20 rounded-lg" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : !activities || activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-gray-500">
              <Search className="h-14 w-14 mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-700">
                アクティビティが見つかりませんでした
              </p>
              <p className="text-sm mt-2">
                検索条件を変更してもう一度お試しください
              </p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters} className="mt-4">
                  フィルターをリセット
                </Button>
              )}
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-4">
                {activities.length}件のアクティビティ
                {debouncedSearch && `「${debouncedSearch}」の検索結果`}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {activities.map((activity) => (
                  <ActivityCard key={activity.id} activity={activity} />
                ))}
              </div>

              {/* Pagination */}
              {(activities.length === PAGE_SIZE || page > 1) && (
                <div className="flex items-center justify-center gap-3 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    前へ
                  </Button>
                  <span className="text-sm text-gray-600">
                    ページ {page}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={activities.length < PAGE_SIZE}
                  >
                    次へ
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
