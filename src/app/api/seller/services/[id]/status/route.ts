import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// 허용된 상태 전이 맵
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  ACTIVE: ['PAUSED'],
  PAUSED: ['ACTIVE'],
  DRAFT: ['ACTIVE'],
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' } },
      { status: 401 }
    )
  }

  if (!UUID_REGEX.test(params.id)) {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: '유효하지 않은 서비스 ID입니다' } },
      { status: 400 }
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

  const { status: newStatus } = body

  if (!newStatus || typeof newStatus !== 'string') {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: 'status 필드가 필요합니다' } },
      { status: 400 }
    )
  }

  // 서비스 조회 + 소유자 검증
  const { data: service, error: fetchError } = await supabase
    .from('services')
    .select('id, seller_id, status')
    .eq('id', params.id)
    .single()

  if (fetchError || !service) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: '서비스를 찾을 수 없습니다' } },
      { status: 404 }
    )
  }

  if (service.seller_id !== user.id) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: '본인의 서비스만 수정할 수 있습니다' } },
      { status: 403 }
    )
  }

  const currentStatus = service.status as string
  const allowed = ALLOWED_TRANSITIONS[currentStatus] ?? []

  if (!allowed.includes(newStatus)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'NOT_ALLOWED',
          message: `${currentStatus} 상태에서 ${newStatus}로 변경할 수 없습니다`,
        },
      },
      { status: 400 }
    )
  }

  const { error: updateError } = await supabase
    .from('services')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('seller_id', user.id)

  if (updateError) {
    console.error('service status update error:', updateError.message)
    return NextResponse.json(
      { success: false, error: { code: 'UPDATE_ERROR', message: '상태 변경에 실패했습니다' } },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
