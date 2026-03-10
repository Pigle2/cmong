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

  const { nickname, bio } = body

  if (!nickname || typeof nickname !== 'string' || nickname.trim().length === 0 || nickname.trim().length > 50) {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: '닉네임은 1~50자여야 합니다' } },
      { status: 400 }
    )
  }

  if (bio !== undefined && bio !== null && (typeof bio !== 'string' || bio.length > 500)) {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: '소개는 최대 500자입니다' } },
      { status: 400 }
    )
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      nickname: nickname.trim(),
      bio: bio?.trim() || null,
    })
    .eq('id', user.id)

  if (error) {
    console.error('profile update error:', error.message)
    return NextResponse.json(
      { success: false, error: { code: 'UPDATE_ERROR', message: '프로필 수정에 실패했습니다' } },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
