import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
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
      { success: false, error: { code: 'FORBIDDEN', message: '본인의 서비스만 삭제할 수 있습니다' } },
      { status: 403 }
    )
  }

  if (service.status === 'DELETED') {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_ALLOWED', message: '이미 삭제된 서비스입니다' } },
      { status: 400 }
    )
  }

  // 서비스 soft delete + 관련 데이터 정리
  const { error: updateError } = await supabase
    .from('services')
    .update({ status: 'DELETED', updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('seller_id', user.id)

  if (updateError) {
    console.error('service delete error:', updateError.message)
    return NextResponse.json(
      { success: false, error: { code: 'UPDATE_ERROR', message: '서비스 삭제에 실패했습니다' } },
      { status: 500 }
    )
  }

  // 고아 데이터 정리: 찜 목록에서 제거
  await supabase
    .from('favorites')
    .delete()
    .eq('service_id', params.id)

  return NextResponse.json({ success: true })
}
