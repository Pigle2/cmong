import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params
  const supabase = await createClient()

  // UUID 검증
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: '유효하지 않은 주문 ID입니다' } },
      { status: 400 }
    )
  }

  // 인증 검증
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' } },
      { status: 401 }
    )
  }

  // 주문 조회
  const { data: order, error } = await supabase
    .from('orders')
    .select('id, order_number, status, buyer_id, service:services(title)')
    .eq('id', id)
    .single()

  if (error || !order) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: '주문을 찾을 수 없습니다' } },
      { status: 404 }
    )
  }

  // 소유권 검증 — 구매자만 리뷰 작성 가능
  if (order.buyer_id !== user.id) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: '본인의 주문만 리뷰를 작성할 수 있습니다' } },
      { status: 403 }
    )
  }

  // 상태 검증 — COMPLETED만 리뷰 가능
  if (order.status !== 'COMPLETED') {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: '완료된 주문만 리뷰를 작성할 수 있습니다' } },
      { status: 400 }
    )
  }

  // 기존 리뷰 존재 여부 확인
  const { data: existingReview } = await supabase
    .from('reviews')
    .select('id')
    .eq('order_id', id)
    .single()

  if (existingReview) {
    return NextResponse.json(
      { success: false, error: { code: 'DUPLICATE', message: '이미 리뷰를 작성하셨습니다' } },
      { status: 409 }
    )
  }

  return NextResponse.json({
    success: true,
    data: {
      id: order.id,
      order_number: order.order_number,
      service: order.service,
    }
  })
}
