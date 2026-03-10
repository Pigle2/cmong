import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
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

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: '잘못된 요청입니다' } },
      { status: 400 }
    )
  }
  const { reply } = body

  if (!reply || typeof reply !== 'string' || reply.trim().length === 0 || reply.length > 2000) {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: '답글은 1~2000자여야 합니다' } },
      { status: 400 }
    )
  }

  // Verify user is the seller + check existing reply
  const { data: review } = await supabase
    .from('reviews')
    .select('seller_id, seller_reply')
    .eq('id', params.id)
    .single()

  if (!review || review.seller_id !== user.id) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: '권한이 없습니다' } },
      { status: 403 }
    )
  }

  if (review.seller_reply) {
    return NextResponse.json(
      { success: false, error: { code: 'ALREADY_REPLIED', message: '이미 답글을 작성했습니다' } },
      { status: 409 }
    )
  }

  const { error } = await supabase
    .from('reviews')
    .update({
      seller_reply: reply.trim(),
      seller_replied_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .is('seller_reply', null)

  if (error) {
    console.error('review reply error:', error.message)
    return NextResponse.json(
      { success: false, error: { code: 'UPDATE_ERROR', message: '답글 저장에 실패했습니다' } },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
