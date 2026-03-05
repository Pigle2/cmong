'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Category } from '@/types'

interface ServiceFiltersProps {
  categories: Category[]
  selectedCategory: string
  selectedSort: string
}

const SORT_OPTIONS = [
  { value: 'recommended', label: '추천순' },
  { value: 'newest', label: '최신순' },
  { value: 'rating', label: '평점순' },
  { value: 'orders', label: '주문 많은순' },
  { value: 'price_asc', label: '가격 낮은순' },
  { value: 'price_desc', label: '가격 높은순' },
]

export function ServiceFilters({
  categories,
  selectedCategory,
  selectedSort,
}: ServiceFiltersProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold">카테고리</h3>
        <ul className="space-y-1">
          <li>
            <Link
              href="/services"
              className={cn(
                'block rounded-md px-3 py-1.5 text-sm',
                !selectedCategory
                  ? 'bg-primary/10 font-medium text-primary'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              전체
            </Link>
          </li>
          {categories.map((cat) => (
            <li key={cat.id}>
              <Link
                href={`/services?category=${cat.slug}`}
                className={cn(
                  'block rounded-md px-3 py-1.5 text-sm',
                  selectedCategory === cat.slug
                    ? 'bg-primary/10 font-medium text-primary'
                    : 'text-muted-foreground hover:bg-muted'
                )}
              >
                {cat.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">정렬</h3>
        <ul className="space-y-1">
          {SORT_OPTIONS.map((opt) => (
            <li key={opt.value}>
              <Link
                href={`/services?${new URLSearchParams({
                  ...(selectedCategory && { category: selectedCategory }),
                  sort: opt.value,
                }).toString()}`}
                className={cn(
                  'block rounded-md px-3 py-1.5 text-sm',
                  selectedSort === opt.value
                    ? 'bg-primary/10 font-medium text-primary'
                    : 'text-muted-foreground hover:bg-muted'
                )}
              >
                {opt.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
