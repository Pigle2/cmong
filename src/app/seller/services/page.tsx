export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Star, Eye, ShoppingCart, Edit } from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'
import { SERVICE_STATUS } from '@/lib/constants'

export default async function SellerServicesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: services } = await supabase
    .from('services')
    .select('*, packages:service_packages(*), category:categories!category_id(name)')
    .eq('seller_id', user.id)
    .neq('status', 'DELETED')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">서비스 관리</h1>
        <Link href="/seller/services/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            새 서비스 등록
          </Button>
        </Link>
      </div>

      {services && services.length > 0 ? (
        <div className="space-y-4">
          {services.map((service: any) => {
            const minPrice = service.packages?.reduce(
              (min: number, pkg: any) => (pkg.price < min ? pkg.price : min),
              Infinity
            )
            return (
              <Card key={service.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                    {service.thumbnail_url ? (
                      <img src={service.thumbnail_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-2xl">🎨</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge variant={service.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-xs">
                        {SERVICE_STATUS[service.status as keyof typeof SERVICE_STATUS]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {service.category?.name}
                      </span>
                    </div>
                    <h3 className="mb-2 truncate font-medium">{service.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5" />
                        {Number(service.avg_rating).toFixed(1)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {service.view_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <ShoppingCart className="h-3.5 w-3.5" />
                        {service.order_count}건
                      </span>
                      <span className="font-medium text-foreground">
                        {minPrice && minPrice !== Infinity ? formatPrice(minPrice) : '-'}
                      </span>
                    </div>
                  </div>
                  <Link href={`/seller/services/${service.id}/edit`}>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Edit className="h-3.5 w-3.5" />
                      수정
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="mb-4 text-muted-foreground">등록된 서비스가 없습니다</p>
          <Link href="/seller/services/new">
            <Button>첫 서비스 등록하기</Button>
          </Link>
        </div>
      )}
    </div>
  )
}
