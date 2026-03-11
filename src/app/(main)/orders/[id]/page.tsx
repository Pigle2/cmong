export const dynamic = 'force-dynamic'

import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OrderTimeline } from '@/components/features/order/order-timeline'
import { OrderProgressBar } from '@/components/features/order/order-progress-bar'
import { OrderActions } from '@/components/features/order/order-actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ORDER_STATUS, ORDER_STATUS_COLORS, PACKAGE_TIER_LABELS } from '@/lib/constants'
import { formatPrice, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface Props {
  params: { id: string }
}

export default async function OrderDetailPage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      service:services(id, title, thumbnail_url),
      buyer:profiles!buyer_id(id, nickname, avatar_url),
      seller:profiles!seller_id(id, nickname, avatar_url),
      package:service_packages!package_id(name, tier, price, work_days, revision_count)
    `)
    .eq('id', params.id)
    .single()

  if (!order) notFound()

  // Check access
  if (order.buyer_id !== user.id && order.seller_id !== user.id) notFound()

  const { data: history } = await supabase
    .from('order_status_history')
    .select('*, changed_by_user:profiles!changed_by(nickname)')
    .eq('order_id', order.id)
    .order('created_at', { ascending: true })

  const { data: review } = await supabase
    .from('reviews')
    .select('id')
    .eq('order_id', order.id)
    .single()

  const { count: usedRevisionCount } = await supabase
    .from('order_status_history')
    .select('*', { count: 'exact', head: true })
    .eq('order_id', order.id)
    .eq('to_status', 'REVISION_REQUESTED')

  const isBuyer = order.buyer_id === user.id
  const isSeller = order.seller_id === user.id

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Link
              href="/orders"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              주문 내역
            </Link>
          </div>
          <h1 className="text-2xl font-bold">주문 상세</h1>
          <p className="text-sm text-muted-foreground">{order.order_number}</p>
        </div>
        <Badge className={`text-sm ${ORDER_STATUS_COLORS[order.status] || ''}`}>
          {ORDER_STATUS[order.status as keyof typeof ORDER_STATUS]}
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <OrderProgressBar status={order.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Service Info */}
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

          {/* Requirements */}
          {order.requirements && (
            <Card>
              <CardHeader><CardTitle className="text-lg">요구사항</CardTitle></CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{order.requirements}</p>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader><CardTitle className="text-lg">진행 상황</CardTitle></CardHeader>
            <CardContent>
              <OrderTimeline history={history || []} />
            </CardContent>
          </Card>

          {/* Actions */}
          <OrderActions
            order={order}
            isBuyer={isBuyer}
            isSeller={isSeller}
            hasReview={!!review}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">주문 정보</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">주문번호</span>
                <span>{order.order_number}</span>
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
                <span>
                  {usedRevisionCount ?? 0}/{order.package?.revision_count ?? 0}회 사용
                </span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>총 금액</span>
                <span className="text-primary">{formatPrice(order.total_amount)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">{isBuyer ? '판매자' : '구매자'}</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium">
                  {(isBuyer ? order.seller?.nickname : order.buyer?.nickname)?.slice(0, 2)}
                </div>
                <span className="font-medium">
                  {isBuyer ? order.seller?.nickname : order.buyer?.nickname}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
