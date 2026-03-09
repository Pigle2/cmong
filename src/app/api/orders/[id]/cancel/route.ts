import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 취소 가능 여부 및 환불 정책 결정
function getCancelPolicy(status: string, isBuyer: boolean): { allowed: boolean; refundRate: number; reason?: string } {
  // DELIVERED 이후는 취소 불가
  if (['DELIVERED', 'COMPLETED', 'REJECTED', 'CANCELLED', 'REFUNDED', 'DISPUTED'].includes(status)) {
    return { allowed: false, refundRate: 0, reason: '현재 주문 상태에서는 취소할 수 없습니다' }
  }

  if (isBuyer) {
    if (['PAID', 'ACCEPTED'].includes(status)) {
      return { allowed: true, refundRate: 100 }
    }
    if (status === 'IN_PROGRESS') {
      // 구매자는 50% 환불 (판매자 동의 필요 - 여기서는 직접 취소 처리)
      return { allowed: true, refundRate: 50 }
    }
    if (status === 'REVISION_REQUESTED') {
      return { allowed: true, refundRate: 50 }
    }
  } else {
    // 판매자는 PAID, ACCEPTED, IN_PROGRESS 시 취소 가능 (전액 환불)
    if (['PAID', 'ACCEPTED', 'IN_PROGRESS'].includes(status)) {
      return { allowed: true, refundRate: 100 }
    }
  }

  return { allowed: false, refundRate: 0, reason: '현재 주문 상태에서는 취소할 수 없습니다' }
}

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
  const { reason } = body
  if (!reason || reason.trim().length < 5) {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: '취소 사유를 5자 이상 입력해주세요' } },
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

  const isBuyer = order.buyer_id === user.id
  const isSeller = order.seller_id === user.id

  if (!isBuyer && !isSeller) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: '접근 권한이 없습니다' } },
      { status: 403 }
    )
  }

  const policy = getCancelPolicy(order.status, isBuyer)
  if (!policy.allowed) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_ALLOWED', message: policy.reason } },
      { status: 400 }
    )
  }

  const now = new Date().toISOString()
  const { data: updated, error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'CANCELLED',
      cancelled_at: now,
      cancel_reason: reason.trim(),
      updated_at: now,
    })
    .eq('id', params.id)
    .eq('status', order.status)
    .select('id')

  if (updateError) {
    console.error('Order cancel error:', updateError.message)
    return NextResponse.json(
      { success: false, error: { code: 'UPDATE_ERROR', message: '주문 취소에 실패했습니다' } },
      { status: 500 }
    )
  }

  if (!updated || updated.length === 0) {
    return NextResponse.json(
      { success: false, error: { code: 'CONFLICT', message: '주문 상태가 변경되었습니다. 페이지를 새로고침해주세요' } },
      { status: 409 }
    )
  }

  // 상태 히스토리 기록
  await supabase.from('order_status_history').insert({
    order_id: order.id,
    from_status: order.status,
    to_status: 'CANCELLED',
    changed_by: user.id,
    note: `취소 사유: ${reason.trim()} (환불율: ${policy.refundRate}%)`,
  })

  // 상대방에게 알림 발송
  const targetUserId = isBuyer ? order.seller_id : order.buyer_id
  await supabase.from('notifications').insert({
    user_id: targetUserId,
    type: 'ORDER',
    title: '주문이 취소되었습니다',
    message: `주문 ${order.order_number}이 취소되었습니다. 환불율: ${policy.refundRate}%`,
    link: `/orders/${order.id}`,
  })

  return NextResponse.json({
    success: true,
    data: { refundRate: policy.refundRate },
  })
}
