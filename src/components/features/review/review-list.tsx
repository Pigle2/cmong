'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn, formatRelativeTime } from '@/lib/utils'

interface ReviewListProps {
  reviews: any[]
  avgRating: number
}

type SortBy = 'newest' | 'highest' | 'lowest'

export function ReviewList({ reviews, avgRating }: ReviewListProps) {
  const [filterRating, setFilterRating] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<SortBy>('newest')

  if (reviews.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        아직 리뷰가 없습니다
      </p>
    )
  }

  // Rating distribution (전체 리뷰 기준 - 필터 적용 전)
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
    percent: (reviews.filter((r) => Math.round(r.rating) === star).length / reviews.length) * 100,
  }))

  // 필터 적용
  const filteredReviews = filterRating === null
    ? reviews
    : reviews.filter((r) => Math.round(r.rating) === filterRating)

  // 정렬 적용
  const sortedReviews = [...filteredReviews].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
    if (sortBy === 'highest') {
      return b.rating - a.rating
    }
    // lowest
    return a.rating - b.rating
  })

  const filterButtons: { label: string; value: number | null }[] = [
    { label: '전체', value: null },
    { label: '5점', value: 5 },
    { label: '4점', value: 4 },
    { label: '3점', value: 3 },
    { label: '2점', value: 2 },
    { label: '1점', value: 1 },
  ]

  return (
    <div>
      {/* Rating summary */}
      <div className="mb-6 flex items-start gap-8 rounded-lg bg-muted/30 p-6">
        <div className="text-center">
          <div className="text-4xl font-bold">{avgRating.toFixed(1)}</div>
          <div className="mt-1 flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${
                  star <= Math.round(avgRating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-muted-foreground/30'
                }`}
              />
            ))}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {reviews.length}개 리뷰
          </div>
        </div>
        <div className="flex-1 space-y-1.5">
          {distribution.map(({ star, count, percent }) => (
            <div key={star} className="flex items-center gap-2 text-sm">
              <span className="w-8 text-right text-muted-foreground">{star}점</span>
              <Progress value={percent} className="h-2 flex-1" />
              <span className="w-8 text-muted-foreground">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter / Sort bar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        {/* Rating filter pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {filterButtons.map(({ label, value }) => (
            <button
              key={label}
              onClick={() => setFilterRating(value)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                filterRating === value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Sort dropdown */}
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
          <SelectTrigger className="h-8 w-[130px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">최신순</SelectItem>
            <SelectItem value="highest">평점 높은순</SelectItem>
            <SelectItem value="lowest">평점 낮은순</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Filtered count */}
      <p className="mb-4 text-sm text-muted-foreground">
        {sortedReviews.length}개의 리뷰
      </p>

      {/* Review items */}
      {sortedReviews.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          해당 평점의 리뷰가 없습니다
        </p>
      ) : (
        <div className="space-y-6">
          {sortedReviews.map((review: any) => (
            <div key={review.id} className="border-b pb-6 last:border-0">
              <div className="mb-2 flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={review.reviewer?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {review.reviewer?.nickname?.slice(0, 2) || '??'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <span className="text-sm font-medium">
                    {review.reviewer?.nickname || '익명'}
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {formatRelativeTime(review.created_at)}
                  </span>
                </div>
              </div>
              <div className="mb-2 flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-3.5 w-3.5 ${
                      star <= review.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm leading-relaxed">{review.content}</p>

              {review.seller_reply && (
                <div className="mt-3 rounded-md bg-muted/50 p-3">
                  <span className="text-xs font-medium text-primary">판매자 답변</span>
                  <p className="mt-1 text-sm">{review.seller_reply}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
