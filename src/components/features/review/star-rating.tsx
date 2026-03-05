'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  readonly?: boolean
  size?: 'sm' | 'md'
}

export function StarRating({
  value,
  onChange,
  readonly = false,
  size = 'md',
}: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5]
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'

  return (
    <div className="flex items-center gap-0.5">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={cn(
            'focus:outline-none',
            !readonly && 'cursor-pointer hover:scale-110 transition-transform'
          )}
        >
          <Star
            className={cn(
              iconSize,
              star <= value
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground/30'
            )}
          />
        </button>
      ))}
    </div>
  )
}
