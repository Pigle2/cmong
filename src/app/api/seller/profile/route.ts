import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(request: NextRequest) {
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

  const { displayName, introduction, specialties } = body

  if (!displayName || typeof displayName !== 'string' || displayName.trim().length === 0 || displayName.trim().length > 50) {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: '활동명은 1~50자여야 합니다' } },
      { status: 400 }
    )
  }

  if (introduction && (typeof introduction !== 'string' || introduction.length > 2000)) {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: '소개는 최대 2000자입니다' } },
      { status: 400 }
    )
  }

  if (specialties && (!Array.isArray(specialties) || specialties.length > 20)) {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: '전문 분야는 최대 20개입니다' } },
      { status: 400 }
    )
  }

  const validSpecialties = specialties
    ? specialties.filter((s: unknown) => typeof s === 'string' && s.trim().length > 0).map((s: string) => s.trim())
    : []

  // upsert로 TOCTOU 방지 — 존재하면 UPDATE, 없으면 INSERT (atomic)
  const { error } = await supabase
    .from('seller_profiles')
    .upsert({
      user_id: user.id,
      display_name: displayName.trim(),
      introduction: introduction?.trim() || null,
      specialties: validSpecialties,
    }, { onConflict: 'user_id' })

  if (error) {
    console.error('seller profile upsert error:', error.message)
    return NextResponse.json(
      { success: false, error: { code: 'UPSERT_ERROR', message: '판매자 프로필 저장에 실패했습니다' } },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
