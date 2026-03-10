import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const serviceId = searchParams.get('serviceId')

  if (!serviceId || !UUID_REGEX.test(serviceId)) {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: '유효한 serviceId가 필요합니다' } },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('reviews')
    .select('*, reviewer:profiles!reviewer_id(nickname, avatar_url)')
    .eq('service_id', serviceId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json(
      { success: false, error: { code: 'QUERY_ERROR', message: '리뷰 조회에 실패했습니다' } },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data })
}

export async function POST(request: NextRequest) {
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
  const { orderId, rating, qualityRating, communicationRating, deliveryRating, content } = body

  // 입력값 검증
  if (!orderId || typeof orderId !== 'string' || !UUID_REGEX.test(orderId)) {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: '유효한 orderId가 필요합니다' } },
      { status: 400 }
    )
  }

  const validateRating = (v: unknown) => typeof v === 'number' && v >= 1 && v <= 5
  if (!validateRating(rating) || !validateRating(qualityRating) || !validateRating(communicationRating) || !validateRating(deliveryRating)) {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: '평점은 1~5 사이의 숫자여야 합니다' } },
      { status: 400 }
    )
  }

  if (!content || typeof content !== 'string' || content.trim().length === 0 || content.length > 2000) {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: '리뷰 내용은 1~2000자여야 합니다' } },
      { status: 400 }
    )
  }

  // 주문 조회: 해당 주문이 존재하는지, 구매자인지, COMPLETED 상태인지 서버에서 검증
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, status, buyer_id, seller_id, service_id, order_number')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: '주문을 찾을 수 없습니다' } },
      { status: 404 }
    )
  }

  // 구매자 본인인지 검증
  if (order.buyer_id !== user.id) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: '본인 주문에만 리뷰를 작성할 수 있습니다' } },
      { status: 403 }
    )
  }

  // 주문 상태 검증 (COMPLETED 상태여야만 리뷰 작성 가능)
  if (order.status !== 'COMPLETED') {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_ALLOWED', message: '구매 확정된 주문에만 리뷰를 작성할 수 있습니다' } },
      { status: 400 }
    )
  }

  // 중복 리뷰 검증
  const { data: existingReview } = await supabase
    .from('reviews')
    .select('id')
    .eq('order_id', orderId)
    .single()

  if (existingReview) {
    return NextResponse.json(
      { success: false, error: { code: 'CONFLICT', message: '이미 리뷰를 작성하셨습니다' } },
      { status: 409 }
    )
  }

  // 리뷰 INSERT — seller_id는 주문에서 가져오므로 클라이언트 조작 불가
  const { error: insertError } = await supabase.from('reviews').insert({
    order_id: order.id,
    service_id: order.service_id,
    reviewer_id: user.id,
    seller_id: order.seller_id,
    rating,
    quality_rating: qualityRating,
    communication_rating: communicationRating,
    delivery_rating: deliveryRating,
    content: content.trim(),
  })

  if (insertError) {
    console.error('review insert error:', insertError.message)
    return NextResponse.json(
      { success: false, error: { code: 'INSERT_ERROR', message: '리뷰 등록에 실패했습니다' } },
      { status: 500 }
    )
  }

  // 판매자에게 알림
  await supabase.from('notifications').insert({
    user_id: order.seller_id,
    type: 'REVIEW',
    title: '새 리뷰',
    message: `주문 ${order.order_number}에 새로운 리뷰가 등록되었습니다`,
    link: `/services/${order.service_id}`,
  })

  return NextResponse.json({ success: true })
}
