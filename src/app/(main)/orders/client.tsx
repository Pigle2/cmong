'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ORDER_STATUS, ORDER_STATUS_COLORS } from '@/lib/constants'
import { formatPrice, formatDate } from '@/lib/utils'

interface Order {
  id: string
  order_number: string
  status: string
  total_amount: number
  created_at: string
  service: { id: string; title: string; thumbnail_url: string | null } | null
  seller: { nickname: string } | null
  package: { name: string; tier: string } | null
}

interface Props {
  allOrders: Order[]
  activeOrders: Order[]
  completedOrders: Order[]
  cancelledOrders: Order[]
}

function OrderCard({ order }: { order: Order }) {
  return (
    <Link href={`/orders/${order.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
            {order.service?.thumbnail_url ? (
              <img src={order.service.thumbnail_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-xl text-muted-foreground">
                <span>No</span>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <Badge className={ORDER_STATUS_COLORS[order.status] || ''}>
                {ORDER_STATUS[order.status as keyof typeof ORDER_STATUS] || order.status}
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
  )
}

function EmptyState() {
  return (
    <div className="py-20 text-center">
      <p className="text-muted-foreground">주문 내역이 없습니다</p>
      <Link href="/services" className="mt-4 inline-block text-primary hover:underline">
        서비스 둘러보기
      </Link>
    </div>
  )
}

function OrderList({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return <EmptyState />
  }
  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  )
}

export function BuyerOrdersClient({ allOrders, activeOrders, completedOrders, cancelledOrders }: Props) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">주문 내역</h1>

      <Tabs defaultValue="all">
        <TabsList className="mb-4 h-auto flex-wrap gap-1">
          <TabsTrigger value="all">
            전체 ({allOrders.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            진행중 ({activeOrders.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            완료 ({completedOrders.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            취소 ({cancelledOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <OrderList orders={allOrders} />
        </TabsContent>

        <TabsContent value="active">
          <OrderList orders={activeOrders} />
        </TabsContent>

        <TabsContent value="completed">
          <OrderList orders={completedOrders} />
        </TabsContent>

        <TabsContent value="cancelled">
          <OrderList orders={cancelledOrders} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
