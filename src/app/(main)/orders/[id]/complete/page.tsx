export const dynamic = 'force-dynamic'

import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatPrice, formatDate } from '@/lib/utils'
import { PACKAGE_TIER_LABELS } from '@/lib/constants'
import Link from 'next/link'
import { CheckCircle2, MessageSquare, FileText } from 'lucide-react'

interface Props {
  params: { id: string }
}

export default async function OrderCompletePage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      service:services(id, title, thumbnail_url),
      seller:profiles!seller_id(nickname),
      package:service_packages!package_id(name, tier, price, work_days, revision_count)
    `)
    .eq('id', params.id)
    .single()

  if (!order) notFound()
  if (order.buyer_id !== user.id) notFound()

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 text-center">
        <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-500" />
        <h1 className="text-2xl font-bold">주문이 완료되었습니다!</h1>
        <p className="mt-2 text-muted-foreground">
          판매자가 주문을 확인하면 작업이 시작됩니다.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
              {order.service?.thumbnail_url ? (
                <img src={order.service.thumbnail_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-lg">🎨</div>
              )}
            </div>
            <div>
              <p className="font-medium">{order.service?.title}</p>
              <p className="text-sm text-muted-foreground">
                판매자: {order.seller?.nickname}
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">주문번호</span>
              <span className="font-mono">{order.order_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">패키지</span>
              <span>{PACKAGE_TIER_LABELS[order.package?.tier || ''] || order.package?.tier} - {order.package?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">작업일</span>
              <span>{order.package?.work_days}일</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">수정 횟수</span>
              <span>{order.package?.revision_count}회</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">주문일</span>
              <span>{formatDate(order.created_at)}</span>
            </div>
          </div>

          <Separator />

          <div className="flex justify-between text-lg font-semibold">
            <span>결제 금액</span>
            <span className="text-primary">{formatPrice(order.total_amount)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 rounded-lg border bg-muted/30 p-4">
        <h3 className="mb-3 font-medium">다음 단계</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">1</span>
            판매자가 주문을 수락하면 알림을 보내드립니다.
          </li>
          <li className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">2</span>
            채팅으로 판매자와 소통하며 작업을 진행합니다.
          </li>
          <li className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">3</span>
            납품이 완료되면 확인 후 리뷰를 남겨주세요.
          </li>
        </ul>
      </div>

      <div className="mt-6 flex gap-3">
        <Link href={`/orders/${order.id}`} className="flex-1">
          <Button variant="outline" className="w-full gap-2">
            <FileText className="h-4 w-4" />
            주문 상세 보기
          </Button>
        </Link>
        <Link href={`/chat?order=${order.id}`} className="flex-1">
          <Button className="w-full gap-2">
            <MessageSquare className="h-4 w-4" />
            판매자에게 메시지
          </Button>
        </Link>
      </div>

      <div className="mt-4 text-center">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          메인으로 돌아가기
        </Link>
      </div>
    </div>
  )
}
