import { Star } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { formatRelativeTime } from '@/lib/utils'

interface ReviewListProps {
  reviews: any[]
  avgRating: number
}

export function ReviewList({ reviews, avgRating }: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        아직 리뷰가 없습니다
      </p>
    )
  }

  // Rating distribution
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
    percent: (reviews.filter((r) => Math.round(r.rating) === star).length / reviews.length) * 100,
  }))

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

      {/* Review items */}
      <div className="space-y-6">
        {reviews.map((review: any) => (
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
    </div>
  )
}
