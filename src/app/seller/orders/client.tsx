'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ORDER_STATUS, ORDER_STATUS_COLORS, PACKAGE_TIER_LABELS } from '@/lib/constants'
import { formatPrice, formatRelativeTime, truncate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface Order {
  id: string
  order_number: string
  status: string
  total_amount: number
  requirements: string | null
  created_at: string
  due_date: string | null
  service: { id: string; title: string; thumbnail_url: string | null } | null
  buyer: { nickname: string } | null
  package: { name: string; tier: string; work_days: number | null } | null
}

interface Props {
  pendingOrders: Order[]
  activeOrders: Order[]
  deliveredOrders: Order[]
  completedOrders: Order[]
  cancelledOrders: Order[]
}

function OrderThumbnail({ url }: { url: string | null }) {
  return (
    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
      {url ? (
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-lg text-muted-foreground">
          <span>No</span>
        </div>
      )}
    </div>
  )
}

function OrderCard({ order, children }: { order: Order; children?: React.ReactNode }) {
  const tierLabel = order.package?.tier
    ? (PACKAGE_TIER_LABELS[order.package.tier] || order.package.tier)
    : null

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex items-start gap-4 p-4">
        <OrderThumbnail url={order.service?.thumbnail_url ?? null} />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <Badge className={ORDER_STATUS_COLORS[order.status] || ''}>
              {ORDER_STATUS[order.status as keyof typeof ORDER_STATUS] || order.status}
            </Badge>
            <span className="text-xs text-muted-foreground">{order.order_number}</span>
            <span className="ml-auto text-xs text-muted-foreground">
              {formatRelativeTime(order.created_at)}
            </span>
          </div>
          <h3 className="truncate text-sm font-medium">{order.service?.title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>구매자: {order.buyer?.nickname}</span>
            {tierLabel && <span>{tierLabel}</span>}
            <span>{formatPrice(order.total_amount)}</span>
          </div>
          {children}
        </div>
      </CardContent>
    </Card>
  )
}

function PendingOrderCard({ order }: { order: Order }) {
  const { toast } = useToast()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [actionLoading, setActionLoading] = useState<'ACCEPTED' | 'REJECTED' | null>(null)

  async function handleAction(status: 'ACCEPTED' | 'REJECTED') {
    setActionLoading(status)
    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        toast({
          variant: 'destructive',
          title: status === 'ACCEPTED' ? '주문 수락 실패' : '주문 거절 실패',
          description: data.error?.message || '처리 중 오류가 발생했습니다',
        })
        return
      }

      toast({
        title: status === 'ACCEPTED' ? '주문을 수락했습니다' : '주문을 거절했습니다',
        description: `${order.order_number} 처리가 완료되었습니다`,
      })
      startTransition(() => {
        router.refresh()
      })
    } catch {
      toast({
        variant: 'destructive',
        title: '오류',
        description: '네트워크 오류가 발생했습니다. 다시 시도해주세요',
      })
    } finally {
      setActionLoading(null)
    }
  }

  const isLoading = actionLoading !== null || isPending

  return (
    <Card className="border-blue-200 bg-blue-50/30 transition-shadow hover:shadow-md">
      <CardContent className="flex items-start gap-4 p-4">
        <OrderThumbnail url={order.service?.thumbnail_url ?? null} />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <Badge className={ORDER_STATUS_COLORS['PAID'] || ''}>결제완료</Badge>
            <span className="text-xs text-muted-foreground">{order.order_number}</span>
            <span className="ml-auto text-xs text-muted-foreground">
              {formatRelativeTime(order.created_at)}
            </span>
          </div>
          <h3 className="truncate text-sm font-medium">{order.service?.title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>구매자: {order.buyer?.nickname}</span>
            {order.package?.tier && (
              <span>
                {PACKAGE_TIER_LABELS[order.package.tier] || order.package.tier}
                {order.package.name ? ` - ${order.package.name}` : ''}
              </span>
            )}
            <span>{formatPrice(order.total_amount)}</span>
          </div>
          {order.requirements && (
            <p className="mt-2 rounded-md bg-white/80 px-3 py-2 text-xs text-muted-foreground">
              {truncate(order.requirements, 100)}
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              onClick={() => handleAction('ACCEPTED')}
              disabled={isLoading}
            >
              {actionLoading === 'ACCEPTED' ? '처리중...' : '주문 수락'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAction('REJECTED')}
              disabled={isLoading}
            >
              {actionLoading === 'REJECTED' ? '처리중...' : '주문 거절'}
            </Button>
            <Link href={`/seller/orders/${order.id}`} className="ml-auto">
              <Button size="sm" variant="ghost" className="text-xs">
                상세보기
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="py-10 text-center text-sm text-muted-foreground">{message}</p>
  )
}

function LinkedOrderList({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return <EmptyState message="주문이 없습니다" />
  }
  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Link key={order.id} href={`/seller/orders/${order.id}`}>
          <OrderCard order={order} />
        </Link>
      ))}
    </div>
  )
}

export function SellerOrdersClient({
  pendingOrders,
  activeOrders,
  deliveredOrders,
  completedOrders,
  cancelledOrders,
}: Props) {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">주문 관리</h1>
      <Tabs defaultValue="pending">
        <TabsList className="mb-4 flex-wrap gap-1 h-auto">
          <TabsTrigger value="pending">
            대기 ({pendingOrders.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            진행중 ({activeOrders.length})
          </TabsTrigger>
          <TabsTrigger value="delivered">
            납품완료 ({deliveredOrders.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            완료 ({completedOrders.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            취소/분쟁 ({cancelledOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {pendingOrders.length === 0 ? (
            <EmptyState message="대기 중인 주문이 없습니다" />
          ) : (
            <div className="space-y-4">
              {pendingOrders.map((order) => (
                <PendingOrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active">
          <LinkedOrderList orders={activeOrders} />
        </TabsContent>

        <TabsContent value="delivered">
          <LinkedOrderList orders={deliveredOrders} />
        </TabsContent>

        <TabsContent value="completed">
          <LinkedOrderList orders={completedOrders} />
        </TabsContent>

        <TabsContent value="cancelled">
          <LinkedOrderList orders={cancelledOrders} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
