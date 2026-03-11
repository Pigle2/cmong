'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Category } from '@/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'

interface ServiceFiltersProps {
  categories: Category[]
  selectedCategory: string
  selectedSort: string
  selectedMinPrice: string
  selectedMaxPrice: string
  selectedWorkDays: string
  selectedMinRating: string
  selectedSellerGrade: string
  selectedMinOrders: string
  searchQuery: string
}

const SORT_OPTIONS = [
  { value: 'recommended', label: '추천순' },
  { value: 'newest', label: '최신순' },
  { value: 'rating', label: '평점순' },
  { value: 'orders', label: '주문 많은순' },
  { value: 'price_asc', label: '가격 낮은순' },
  { value: 'price_desc', label: '가격 높은순' },
]

const PRICE_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: '0-50000', label: '~50,000원' },
  { value: '0-100000', label: '~100,000원' },
  { value: '0-200000', label: '~200,000원' },
  { value: '0-500000', label: '~500,000원' },
  { value: '500000-', label: '500,000원~' },
]

const WORK_DAYS_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: '1', label: '1일' },
  { value: '3', label: '3일 이내' },
  { value: '7', label: '7일 이내' },
  { value: '14', label: '14일 이내' },
  { value: '30', label: '30일 이내' },
]

const RATING_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: '4.0', label: '4.0 이상' },
  { value: '4.5', label: '4.5 이상' },
  { value: '4.8', label: '4.8 이상' },
]

const SELLER_GRADE_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'MASTER', label: '마스터' },
  { value: 'PRO', label: '전문가' },
  { value: 'GENERAL', label: '일반' },
  { value: 'NEW', label: '신규' },
]

const ORDER_COUNT_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: '10', label: '10건 이상' },
  { value: '50', label: '50건 이상' },
  { value: '100', label: '100건 이상' },
]

function getPriceValue(minPrice: string, maxPrice: string): string {
  if (!minPrice && !maxPrice) return 'all'
  if (minPrice === '500000' && !maxPrice) return '500000-'
  if (!minPrice && maxPrice) return `0-${maxPrice}`
  return 'all'
}

export function ServiceFilters({
  categories,
  selectedCategory,
  selectedSort,
  selectedMinPrice,
  selectedMaxPrice,
  selectedWorkDays,
  selectedMinRating,
  selectedSellerGrade,
  selectedMinOrders,
  searchQuery,
}: ServiceFiltersProps) {
  const router = useRouter()

  function buildParams(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams()
    if (searchQuery) params.set('q', searchQuery)
    if (selectedCategory) params.set('category', selectedCategory)
    if (selectedSort && selectedSort !== 'recommended') params.set('sort', selectedSort)
    if (selectedMinPrice) params.set('minPrice', selectedMinPrice)
    if (selectedMaxPrice) params.set('maxPrice', selectedMaxPrice)
    if (selectedWorkDays) params.set('workDays', selectedWorkDays)
    if (selectedMinRating) params.set('minRating', selectedMinRating)
    if (selectedSellerGrade) params.set('sellerGrade', selectedSellerGrade)
    if (selectedMinOrders) params.set('minOrders', selectedMinOrders)

    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined || value === '' || value === 'all') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    }

    return params.toString()
  }

  function handlePriceChange(value: string) {
    if (value === 'all') {
      router.push(`/services?${buildParams({ minPrice: undefined, maxPrice: undefined })}`)
    } else if (value === '500000-') {
      router.push(`/services?${buildParams({ minPrice: '500000', maxPrice: undefined })}`)
    } else {
      const [, max] = value.split('-')
      router.push(`/services?${buildParams({ minPrice: undefined, maxPrice: max })}`)
    }
  }

  function handleWorkDaysChange(value: string) {
    router.push(`/services?${buildParams({ workDays: value === 'all' ? undefined : value })}`)
  }

  function handleRatingChange(value: string) {
    router.push(`/services?${buildParams({ minRating: value === 'all' ? undefined : value })}`)
  }

  function handleSellerGradeChange(value: string) {
    router.push(`/services?${buildParams({ sellerGrade: value === 'all' ? undefined : value })}`)
  }

  function handleMinOrdersChange(value: string) {
    router.push(`/services?${buildParams({ minOrders: value === 'all' ? undefined : value })}`)
  }

  function handleReset() {
    const params = new URLSearchParams()
    if (searchQuery) params.set('q', searchQuery)
    router.push(`/services?${params.toString()}`)
  }

  const priceValue = getPriceValue(selectedMinPrice, selectedMaxPrice)
  const workDaysValue = selectedWorkDays || 'all'
  const ratingValue = selectedMinRating || 'all'
  const sellerGradeValue = selectedSellerGrade || 'all'
  const minOrdersValue = selectedMinOrders || 'all'

  const hasActiveFilters =
    selectedCategory ||
    (selectedSort && selectedSort !== 'recommended') ||
    selectedMinPrice ||
    selectedMaxPrice ||
    selectedWorkDays ||
    selectedMinRating ||
    selectedSellerGrade ||
    selectedMinOrders

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold">카테고리</h3>
        <ul className="space-y-1">
          <li>
            <Link
              href={`/services?${buildParams({ category: undefined })}`}
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
                href={`/services?${buildParams({ category: cat.slug })}`}
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
                href={`/services?${buildParams({ sort: opt.value === 'recommended' ? undefined : opt.value })}`}
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

      <div>
        <h3 className="mb-3 text-sm font-semibold">가격</h3>
        <Select value={priceValue} onValueChange={handlePriceChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="전체" />
          </SelectTrigger>
          <SelectContent>
            {PRICE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">작업일</h3>
        <Select value={workDaysValue} onValueChange={handleWorkDaysChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="전체" />
          </SelectTrigger>
          <SelectContent>
            {WORK_DAYS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">평점</h3>
        <Select value={ratingValue} onValueChange={handleRatingChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="전체" />
          </SelectTrigger>
          <SelectContent>
            {RATING_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">판매자 등급</h3>
        <Select value={sellerGradeValue} onValueChange={handleSellerGradeChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="전체" />
          </SelectTrigger>
          <SelectContent>
            {SELLER_GRADE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">거래 건수</h3>
        <Select value={minOrdersValue} onValueChange={handleMinOrdersChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="전체" />
          </SelectTrigger>
          <SelectContent>
            {ORDER_COUNT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleReset}
        >
          필터 초기화
        </Button>
      )}
    </div>
  )
}
