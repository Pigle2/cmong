export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ORDER_STATUS, ORDER_STATUS_COLORS } from '@/lib/constants'
import { formatPrice, formatDate } from '@/lib/utils'

export default async function SellerOrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      service:services(id, title, thumbnail_url),
      buyer:profiles!buyer_id(nickname),
      package:service_packages!package_id(name, tier)
    `)
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  const activeOrders = orders?.filter((o: any) =>
    ['PAID', 'ACCEPTED', 'IN_PROGRESS', 'DELIVERED', 'REVISION_REQUESTED'].includes(o.status)
  ) || []

  const completedOrders = orders?.filter((o: any) =>
    ['COMPLETED', 'REJECTED', 'CANCELLED'].includes(o.status)
  ) || []

  const renderOrders = (orderList: any[]) => {
    if (orderList.length === 0) {
      return <p className="py-10 text-center text-sm text-muted-foreground">주문이 없습니다</p>
    }
    return (
      <div className="space-y-4">
        {orderList.map((order: any) => (
          <Link key={order.id} href={`/orders/${order.id}`}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                  {order.service?.thumbnail_url ? (
                    <img src={order.service.thumbnail_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">🎨</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge className={ORDER_STATUS_COLORS[order.status] || ''}>
                      {ORDER_STATUS[order.status as keyof typeof ORDER_STATUS]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{order.order_number}</span>
                  </div>
                  <h3 className="truncate text-sm font-medium">{order.service?.title}</h3>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>구매자: {order.buyer?.nickname}</span>
                    <span>{formatPrice(order.total_amount)}</span>
                    <span>{formatDate(order.created_at)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">주문 관리</h1>
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">진행중 ({activeOrders.length})</TabsTrigger>
          <TabsTrigger value="completed">완료 ({completedOrders.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="active">{renderOrders(activeOrders)}</TabsContent>
        <TabsContent value="completed">{renderOrders(completedOrders)}</TabsContent>
      </Tabs>
    </div>
  )
}
