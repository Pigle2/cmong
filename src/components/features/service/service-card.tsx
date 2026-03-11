import Link from 'next/link'
import Image from 'next/image'
import { Star, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils'

interface ServiceCardProps {
  service: any
}

export function ServiceCard({ service }: ServiceCardProps) {
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
      <Card className="group overflow-hidden transition-shadow hover:shadow-md">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {service.thumbnail_url ? (
            <Image
              src={service.thumbnail_url}
              alt={service.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <span className="text-4xl">🎨</span>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {service.seller?.nickname || '판매자'}
            </span>
          </div>
          <h3 className="mb-2 line-clamp-2 text-sm font-medium leading-snug">
            {service.title}
          </h3>
          <div className="mb-2 flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">
              {Number(service.avg_rating).toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">
              ({service.review_count})
            </span>
          </div>
          <span className="text-sm font-bold">
            {minPrice && minPrice !== Infinity
              ? formatPrice(minPrice)
              : '가격 문의'}
          </span>
          <div className="mt-1 flex items-center justify-between">
            {minWorkDays && minWorkDays !== Infinity ? (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {minWorkDays}일 이내
              </span>
            ) : (
              <span />
            )}
            {service.order_count > 0 && (
              <Badge variant="secondary" className="text-xs">
                {service.order_count}건 완료
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
