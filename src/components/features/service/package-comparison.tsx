'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'
import { PACKAGE_TIER_LABELS } from '@/lib/constants'
import { Clock, RefreshCw, ShoppingCart } from 'lucide-react'
import type { ServicePackage } from '@/types'

interface PackageComparisonProps {
  packages: ServicePackage[]
  serviceId: string
}

export function PackageComparison({ packages, serviceId }: PackageComparisonProps) {
  const router = useRouter()
  const [selectedIndex, setSelectedIndex] = useState(0)

  if (packages.length === 0) {
    return <p className="text-sm text-muted-foreground">등록된 패키지가 없습니다.</p>
  }

  const selected = packages[selectedIndex]

  return (
    <div className="rounded-lg border overflow-hidden">
      {/* 탭 헤더 */}
      <div className="flex border-b">
        {packages.map((pkg, idx) => (
          <button
            key={pkg.id}
            onClick={() => setSelectedIndex(idx)}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              idx === selectedIndex
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {PACKAGE_TIER_LABELS[pkg.tier] || pkg.tier}
          </button>
        ))}
      </div>

      {/* 선택된 패키지 상세 */}
      <div className="p-5 space-y-4">
        {/* 패키지 이름 + 가격 */}
        <div>
          <p className="text-sm text-muted-foreground mb-1">{selected.name}</p>
          <p className="text-2xl font-bold text-primary">{formatPrice(selected.price)}</p>
        </div>

        {/* 설명 */}
        {selected.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {selected.description}
          </p>
        )}

        {/* 메타 정보 */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{selected.work_days}일</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <RefreshCw className="h-4 w-4" />
            <span>수정 {selected.revision_count}회</span>
          </div>
        </div>

        {/* 구매하기 버튼 */}
        <Button
          className="w-full gap-2"
          size="lg"
          onClick={() =>
            router.push(`/orders/new?service=${serviceId}&package=${selected.id}`)
          }
        >
          <ShoppingCart className="h-4 w-4" />
          구매하기
        </Button>
      </div>
    </div>
  )
}
