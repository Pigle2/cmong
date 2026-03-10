import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// 판매자만 수행 가능한 상태 전환
const SELLER_TRANSITIONS: Record<string, string[]> = {
  PAID: ['ACCEPTED', 'REJECTED'],
  ACCEPTED: ['IN_PROGRESS'],
}

// 상태별 알림 메시지
const STATUS_LABELS: Record<string, string> = {
  ACCEPTED: '수락',
  REJECTED: '거절',
  IN_PROGRESS: '작업 시작',
}

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
  const { status: newStatus, note } = body

  if (!newStatus || typeof newStatus !== 'string') {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: '변경할 상태를 지정해주세요' } },
      { status: 400 }
    )
  }

  // 허용된 상태값인지 확인
  const allAllowedStatuses = Object.values(SELLER_TRANSITIONS).flat()
  if (!allAllowedStatuses.includes(newStatus)) {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: '허용되지 않은 상태값입니다' } },
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

  // 판매자 권한 검증
  if (order.seller_id !== user.id) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: '판매자만 이 작업을 수행할 수 있습니다' } },
      { status: 403 }
    )
  }

  // 상태 전환 유효성 검증
  const allowed = SELLER_TRANSITIONS[order.status] || []
  if (!allowed.includes(newStatus)) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_ALLOWED', message: `현재 상태(${order.status})에서 ${newStatus}(으)로 변경할 수 없습니다` } },
      { status: 400 }
    )
  }

  const now = new Date().toISOString()
  const { data: updated, error: updateError } = await supabase
    .from('orders')
    .update({ status: newStatus, updated_at: now })
    .eq('id', params.id)
    .eq('status', order.status)
    .select('id')

  if (updateError) {
    console.error('Order status change error:', updateError.message)
    return NextResponse.json(
      { success: false, error: { code: 'UPDATE_ERROR', message: '상태 변경에 실패했습니다' } },
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
    to_status: newStatus,
    changed_by: user.id,
    note: note?.trim() || null,
  })

  const statusLabel = STATUS_LABELS[newStatus] || newStatus
  await supabase.from('notifications').insert({
    user_id: order.buyer_id,
    type: 'ORDER',
    title: '주문 상태 변경',
    message: `주문 ${order.order_number}이 ${statusLabel} 처리되었습니다`,
    link: `/orders/${order.id}`,
  })

  return NextResponse.json({ success: true })
}
