'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'
import { PACKAGE_TIER_LABELS } from '@/lib/constants'
import type { ServicePackage } from '@/types'

interface PackageComparisonProps {
  packages: ServicePackage[]
  serviceId: string
}

export function PackageComparison({ packages, serviceId }: PackageComparisonProps) {
  const router = useRouter()

  if (packages.length === 0) {
    return <p className="text-sm text-muted-foreground">등록된 패키지가 없습니다.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border-b p-3 text-left text-sm font-medium text-muted-foreground">
              항목
            </th>
            {packages.map((pkg) => (
              <th
                key={pkg.id}
                className="border-b p-3 text-center text-sm font-semibold"
              >
                <div className="mb-1">
                  {PACKAGE_TIER_LABELS[pkg.tier] || pkg.tier}
                </div>
                <div className="text-xs font-normal text-muted-foreground">
                  {pkg.name}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border-b p-3 text-sm">가격</td>
            {packages.map((pkg) => (
              <td key={pkg.id} className="border-b p-3 text-center text-lg font-bold text-primary">
                {formatPrice(pkg.price)}
              </td>
            ))}
          </tr>
          <tr>
            <td className="border-b p-3 text-sm">작업일</td>
            {packages.map((pkg) => (
              <td key={pkg.id} className="border-b p-3 text-center text-sm">
                {pkg.work_days}일
              </td>
            ))}
          </tr>
          <tr>
            <td className="border-b p-3 text-sm">수정 횟수</td>
            {packages.map((pkg) => (
              <td key={pkg.id} className="border-b p-3 text-center text-sm">
                {pkg.revision_count}회
              </td>
            ))}
          </tr>
          <tr>
            <td className="border-b p-3 text-sm">설명</td>
            {packages.map((pkg) => (
              <td key={pkg.id} className="border-b p-3 text-center text-xs text-muted-foreground">
                {pkg.description || '-'}
              </td>
            ))}
          </tr>
          <tr>
            <td className="p-3" />
            {packages.map((pkg) => (
              <td key={pkg.id} className="p-3 text-center">
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() =>
                    router.push(`/orders/new?service=${serviceId}&package=${pkg.id}`)
                  }
                >
                  주문하기
                </Button>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}
