import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (!UUID_REGEX.test(params.id)) {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: '유효한 주문 ID가 필요합니다' } },
      { status: 400 }
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' } },
      { status: 401 }
    )
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: '잘못된 요청입니다' } },
      { status: 400 }
    )
  }
  const { note } = body

  if (note && (typeof note !== 'string' || note.length > 2000)) {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: '납품 메시지는 최대 2000자입니다' } },
      { status: 400 }
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

  if (order.seller_id !== user.id) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: '판매자만 납품할 수 있습니다' } },
      { status: 403 }
    )
  }

  if (!['IN_PROGRESS', 'REVISION_REQUESTED'].includes(order.status)) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_ALLOWED', message: '작업중 또는 수정요청 상태에서만 납품할 수 있습니다' } },
      { status: 400 }
    )
  }

  const now = new Date().toISOString()
  const { data: updated, error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'DELIVERED',
      delivered_at: now,
      delivery_note: note?.trim() || null,
      updated_at: now,
    })
    .eq('id', params.id)
    .eq('status', order.status)
    .select('id')

  if (updateError) {
    console.error('Order deliver error:', updateError.message)
    return NextResponse.json(
      { success: false, error: { code: 'UPDATE_ERROR', message: '납품 처리에 실패했습니다' } },
      { status: 500 }
    )
  }

  if (!updated || updated.length === 0) {
    return NextResponse.json(
      { success: false, error: { code: 'CONFLICT', message: '주문 상태가 변경되었습니다. 페이지를 새로고침해주세요' } },
      { status: 409 }
    )
  }

  await supabase.from('order_status_history').insert({
    order_id: order.id,
    from_status: order.status,
    to_status: 'DELIVERED',
    changed_by: user.id,
    note: note?.trim() || null,
  })

  await supabase.from('notifications').insert({
    user_id: order.buyer_id,
    type: 'ORDER',
    title: '납품이 완료되었습니다',
    message: `주문 ${order.order_number}의 납품물을 확인해주세요. 5일 내 확인하지 않으면 자동 구매 확정됩니다.`,
    link: `/orders/${order.id}`,
  })

  return NextResponse.json({ success: true })
}
