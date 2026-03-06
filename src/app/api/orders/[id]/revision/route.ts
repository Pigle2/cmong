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

  const body = await request.json()
  const { note } = body
  if (!note || note.trim().length < 5) {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: '수정 요청 내용을 5자 이상 입력해주세요' } },
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

  if (order.buyer_id !== user.id) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: '구매자만 수정을 요청할 수 있습니다' } },
      { status: 403 }
    )
  }

  if (order.status !== 'DELIVERED') {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_ALLOWED', message: '납품완료 상태에서만 수정 요청할 수 있습니다' } },
      { status: 400 }
    )
  }

  const now = new Date().toISOString()
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'REVISION_REQUESTED',
      revision_note: note.trim(),
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
    to_status: 'REVISION_REQUESTED',
    changed_by: user.id,
    note: note.trim(),
  })

  await supabase.from('notifications').insert({
    user_id: order.seller_id,
    type: 'ORDER',
    title: '수정 요청이 접수되었습니다',
    message: `주문 ${order.order_number}에 수정 요청이 접수되었습니다: ${note.trim().slice(0, 50)}`,
    link: `/orders/${order.id}`,
  })

  return NextResponse.json({ success: true })
}
