export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ORDER_STATUS, ORDER_STATUS_COLORS } from '@/lib/constants'
import { formatPrice, formatDate } from '@/lib/utils'

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      service:services(id, title, thumbnail_url),
      seller:profiles!seller_id(nickname),
      package:service_packages!package_id(name, tier)
    `)
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">주문 내역</h1>

      {orders && orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                    {order.service?.thumbnail_url ? (
                      <img src={order.service.thumbnail_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xl">🎨</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge className={ORDER_STATUS_COLORS[order.status] || ''}>
                        {ORDER_STATUS[order.status as keyof typeof ORDER_STATUS]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{order.order_number}</span>
                    </div>
                    <h3 className="truncate font-medium">{order.service?.title}</h3>
                    <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                      <span>판매자: {order.seller?.nickname}</span>
                      <span>{formatPrice(order.total_amount)}</span>
                      <span>{formatDate(order.created_at)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="text-muted-foreground">주문 내역이 없습니다</p>
          <Link href="/services" className="mt-4 inline-block text-primary hover:underline">
            서비스 둘러보기
          </Link>
        </div>
      )}
    </div>
  )
}
