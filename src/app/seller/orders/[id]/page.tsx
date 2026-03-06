export const dynamic = 'force-dynamic'

import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OrderTimeline } from '@/components/features/order/order-timeline'
import { SellerOrderActions } from '@/components/features/order/seller-order-actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ORDER_STATUS, ORDER_STATUS_COLORS, PACKAGE_TIER_LABELS } from '@/lib/constants'
import { formatPrice, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface Props {
  params: { id: string }
}

export default async function SellerOrderDetailPage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      service:services(id, title, thumbnail_url),
      buyer:profiles!buyer_id(id, nickname, avatar_url, email),
      seller:profiles!seller_id(id, nickname),
      package:service_packages!package_id(name, tier, price, work_days, revision_count)
    `)
    .eq('id', params.id)
    .single()

  if (!order) notFound()

  // 판매자 본인의 주문만 접근 허용
  if (order.seller_id !== user.id) notFound()

  const { data: history } = await supabase
    .from('order_status_history')
    .select('*, changed_by_user:profiles!changed_by(nickname)')
    .eq('order_id', order.id)
    .order('created_at', { ascending: true })

  const buyerNickname = order.buyer?.nickname || '구매자'

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/seller/orders"
          className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          주문 목록으로
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">주문 상세</h1>
            <p className="text-sm text-muted-foreground">{order.order_number}</p>
          </div>
          <Badge className={`text-sm ${ORDER_STATUS_COLORS[order.status] || ''}`}>
            {ORDER_STATUS[order.status as keyof typeof ORDER_STATUS]}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* 서비스 정보 */}
          <Card>
            <CardHeader><CardTitle className="text-lg">서비스 정보</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                  {order.service?.thumbnail_url ? (
                    <img src={order.service.thumbnail_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xl">🎨</div>
                  )}
                </div>
                <div>
                  <Link href={`/services/${order.service?.id}`} className="font-medium hover:underline">
                    {order.service?.title}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {PACKAGE_TIER_LABELS[order.package?.tier || ''] || order.package?.tier} - {order.package?.name}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 구매자 요구사항 */}
          {order.requirements && (
            <Card>
              <CardHeader><CardTitle className="text-lg">구매자 요구사항</CardTitle></CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{order.requirements}</p>
              </CardContent>
            </Card>
          )}

          {/* 진행 타임라인 */}
          <Card>
            <CardHeader><CardTitle className="text-lg">진행 타임라인</CardTitle></CardHeader>
            <CardContent>
              <OrderTimeline history={history || []} />
            </CardContent>
          </Card>

          {/* 판매자 액션 */}
          <SellerOrderActions order={order} />
        </div>

        {/* 사이드바 */}
        <div className="space-y-6">
          {/* 주문 정보 */}
          <Card>
            <CardHeader><CardTitle className="text-lg">주문 정보</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">주문번호</span>
                <span className="font-mono text-xs">{order.order_number}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">주문일</span>
                <span>{formatDate(order.created_at)}</span>
              </div>
              {order.due_date && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">납기일</span>
                    <span>{formatDate(order.due_date)}</span>
                  </div>
                </>
              )}
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">작업일</span>
                <span>{order.package?.work_days}일</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">수정 횟수</span>
                <span>{order.package?.revision_count}회</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>총 금액</span>
                <span className="text-primary">{formatPrice(order.total_amount)}</span>
              </div>
            </CardContent>
          </Card>

          {/* 구매자 정보 */}
          <Card>
            <CardHeader><CardTitle className="text-lg">구매자 정보</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={order.buyer?.avatar_url || undefined} />
                  <AvatarFallback className="bg-muted text-sm font-medium">
                    {buyerNickname.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{buyerNickname}</p>
                  {order.buyer?.email && (
                    <p className="text-xs text-muted-foreground">{order.buyer.email}</p>
                  )}
                </div>
              </div>
              <Link
                href={`/chat?userId=${order.buyer_id}`}
                className="block w-full rounded-md border px-3 py-2 text-center text-sm hover:bg-muted"
              >
                구매자에게 메시지 보내기
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
