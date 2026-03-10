import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
  const { serviceId, packageId, requirements } = body

  // 입력값 검증
  if (!serviceId || typeof serviceId !== 'string') {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: 'serviceId가 필요합니다' } },
      { status: 400 }
    )
  }

  if (!packageId || typeof packageId !== 'string') {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: 'packageId가 필요합니다' } },
      { status: 400 }
    )
  }

  if (requirements && (typeof requirements !== 'string' || requirements.length > 5000)) {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: '요구사항은 최대 5000자입니다' } },
      { status: 400 }
    )
  }

  // 서비스 조회 — seller_id는 서버에서 가져옴 (클라이언트 조작 불가)
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('id, seller_id, status')
    .eq('id', serviceId)
    .single()

  if (serviceError || !service) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: '서비스를 찾을 수 없습니다' } },
      { status: 404 }
    )
  }

  if (service.status !== 'ACTIVE') {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_ALLOWED', message: '활성화된 서비스만 주문할 수 있습니다' } },
      { status: 400 }
    )
  }

  // 본인 서비스 주문 방지
  if (service.seller_id === user.id) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: '본인의 서비스는 주문할 수 없습니다' } },
      { status: 403 }
    )
  }

  // 패키지 조회 — price와 work_days는 서버에서 가져옴 (클라이언트 조작 불가)
  const { data: pkg, error: pkgError } = await supabase
    .from('service_packages')
    .select('id, service_id, price, work_days')
    .eq('id', packageId)
    .eq('service_id', serviceId)
    .single()

  if (pkgError || !pkg) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: '패키지를 찾을 수 없습니다' } },
      { status: 404 }
    )
  }

  if (pkg.price <= 0) {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: '유효하지 않은 패키지 가격입니다' } },
      { status: 400 }
    )
  }

  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + pkg.work_days)

  // 주문 생성 — total_amount와 seller_id는 서버에서 DB 조회 결과로 설정
  const { data: order, error: insertError } = await supabase
    .from('orders')
    .insert({
      buyer_id: user.id,
      seller_id: service.seller_id,
      service_id: service.id,
      package_id: pkg.id,
      status: 'PAID',
      requirements: requirements?.trim() || null,
      total_amount: pkg.price,
      due_date: dueDate.toISOString(),
    })
    .select()
    .single()

  if (insertError || !order) {
    console.error('order insert error:', insertError?.message)
    return NextResponse.json(
      { success: false, error: { code: 'INSERT_ERROR', message: '주문에 실패했습니다' } },
      { status: 500 }
    )
  }

  // 상태 히스토리 기록
  await supabase.from('order_status_history').insert({
    order_id: order.id,
    from_status: null,
    to_status: 'PAID',
    changed_by: user.id,
    note: '주문이 생성되었습니다',
  })

  // 판매자에게 알림
  await supabase.from('notifications').insert({
    user_id: service.seller_id,
    type: 'ORDER',
    title: '새 주문',
    message: `새로운 주문이 접수되었습니다`,
    link: `/orders/${order.id}`,
  })

  return NextResponse.json({ success: true, data: { id: order.id } })
}
