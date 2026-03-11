import Link from 'next/link'
import Image from 'next/image'
import { Star, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils'
import { SELLER_GRADES } from '@/lib/constants'

interface ServiceListCardProps {
  service: any
}

export function ServiceListCard({ service }: ServiceListCardProps) {
  const minPrice = service.packages?.reduce(
    (min: number, pkg: any) => (pkg.price < min ? pkg.price : min),
    Infinity
  )

  const minWorkDays = service.packages?.reduce(
    (min: number, pkg: any) =>
      pkg.work_days != null && pkg.work_days < min ? pkg.work_days : min,
    Infinity
  )

  return (
    <Link href={`/services/${service.id}`}>
      <div className="group flex gap-4 rounded-lg border bg-card p-4 transition-shadow hover:shadow-md">
        <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-md bg-muted">
          {service.thumbnail_url ? (
            <Image
              src={service.thumbnail_url}
              alt={service.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <span className="text-3xl">🎨</span>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div>
            <h3 className="mb-1 line-clamp-1 text-sm font-medium leading-snug">
              {service.title}
            </h3>
            <div className="mb-1 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {service.seller?.nickname || '판매자'}
              </span>
              {(() => {
                const sp = Array.isArray(service.seller_profile) ? service.seller_profile[0] : service.seller_profile
                const grade = sp?.grade as keyof typeof SELLER_GRADES | undefined
                if (!grade || grade === 'NEW') return null
                return (
                  <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                    {SELLER_GRADES[grade] || grade}
                  </Badge>
                )
              })()}
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">
                  {Number(service.avg_rating).toFixed(1)}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({service.review_count})
                </span>
              </div>
            </div>
            {service.description && (
              <p className="line-clamp-1 text-xs text-muted-foreground">
                {service.description}
              </p>
            )}
          </div>

          <div className="mt-2 flex items-center gap-3">
            <span className="text-sm font-bold">
              {minPrice && minPrice !== Infinity
                ? `${formatPrice(minPrice)}~`
                : '가격 문의'}
            </span>
            {minWorkDays && minWorkDays !== Infinity && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {minWorkDays}일 이내
              </span>
            )}
            {service.order_count > 0 && (
              <Badge variant="secondary" className="text-xs">
                {service.order_count}건 완료
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
