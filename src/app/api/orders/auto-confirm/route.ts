import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 이 엔드포인트는 Vercel Cron 또는 외부 스케줄러에서 호출됩니다.
// Authorization: Bearer {CRON_SECRET} 헤더로 보호합니다.
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
      { status: 401 }
    )
  }

  const supabase = await createClient()

  // DELIVERED 상태이고 delivered_at으로부터 5일 경과한 주문 조회
  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()

  const { data: orders, error: fetchError } = await supabase
    .from('orders')
    .select('id, order_number, buyer_id, seller_id, delivered_at')
    .eq('status', 'DELIVERED')
    .lte('delivered_at', fiveDaysAgo)
    .not('delivered_at', 'is', null)

  if (fetchError) {
    return NextResponse.json(
      { success: false, error: { code: 'QUERY_ERROR', message: fetchError.message } },
      { status: 500 }
    )
  }

  if (!orders || orders.length === 0) {
    return NextResponse.json({ success: true, data: { confirmed: 0 } })
  }

  const now = new Date().toISOString()
  let confirmed = 0
  const errors: string[] = []

  for (const order of orders) {
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'COMPLETED',
        completed_at: now,
        updated_at: now,
      })
      .eq('id', order.id)
      .eq('status', 'DELIVERED') // 동시성 안전 처리

    if (updateError) {
      errors.push(`${order.id}: ${updateError.message}`)
      continue
    }

    // 상태 히스토리 기록 (시스템 변경이므로 changed_by는 seller_id로 대체)
    await supabase.from('order_status_history').insert({
      order_id: order.id,
      from_status: 'DELIVERED',
      to_status: 'COMPLETED',
      changed_by: order.seller_id,
      note: '자동 구매 확정 (납품 후 5일 경과)',
    })

    // 구매자에게 알림
    await supabase.from('notifications').insert({
      user_id: order.buyer_id,
      type: 'ORDER',
      title: '구매가 자동 확정되었습니다',
      message: `주문 ${order.order_number}이 납품 후 5일 경과로 자동 구매 확정되었습니다.`,
      link: `/orders/${order.id}`,
    })

    // 판매자에게 알림
    await supabase.from('notifications').insert({
      user_id: order.seller_id,
      type: 'ORDER',
      title: '구매가 자동 확정되었습니다',
      message: `주문 ${order.order_number}이 자동 구매 확정되었습니다. 수익이 정산 대기열에 추가됩니다.`,
      link: `/orders/${order.id}`,
    })

    confirmed++
  }

  return NextResponse.json({
    success: true,
    data: { confirmed, total: orders.length, errors: errors.length > 0 ? errors : undefined },
  })
}
