import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' } },
      { status: 401 }
    )
  }

  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('id, status, buyer_id, seller_id, order_number')
    .eq('id', params.id)
    .single()

  if (fetchError || !order) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: '주문을 찾을 수 없습니다' } },
      { status: 404 }
    )
  }

  if (order.buyer_id !== user.id) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: '구매자만 구매 확정할 수 있습니다' } },
      { status: 403 }
    )
  }

  if (order.status !== 'DELIVERED') {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_ALLOWED', message: '납품완료 상태에서만 구매 확정할 수 있습니다' } },
      { status: 400 }
    )
  }

  const now = new Date().toISOString()
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'COMPLETED',
      completed_at: now,
      updated_at: now,
    })
    .eq('id', params.id)

  if (updateError) {
    return NextResponse.json(
      { success: false, error: { code: 'UPDATE_ERROR', message: updateError.message } },
      { status: 500 }
    )
  }

  await supabase.from('order_status_history').insert({
    order_id: order.id,
    from_status: 'DELIVERED',
    to_status: 'COMPLETED',
    changed_by: user.id,
    note: '구매자 수동 구매 확정',
  })

  // 판매자에게 알림
  await supabase.from('notifications').insert({
    user_id: order.seller_id,
    type: 'ORDER',
    title: '구매가 확정되었습니다',
    message: `주문 ${order.order_number}의 구매가 확정되었습니다. 수익이 정산 대기열에 추가됩니다.`,
    link: `/orders/${order.id}`,
  })

  // 구매자에게 리뷰 작성 요청 알림
  await supabase.from('notifications').insert({
    user_id: order.buyer_id,
    type: 'ORDER',
    title: '리뷰를 작성해주세요',
    message: `거래가 완료되었습니다. 판매자에 대한 리뷰를 남겨주세요.`,
    link: `/orders/${order.id}/review`,
  })

  return NextResponse.json({ success: true })
}
