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

  const { reply } = await request.json()

  // Verify user is the seller
  const { data: review } = await supabase
    .from('reviews')
    .select('seller_id')
    .eq('id', params.id)
    .single()

  if (!review || review.seller_id !== user.id) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: '권한이 없습니다' } },
      { status: 403 }
    )
  }

  const { error } = await supabase
    .from('reviews')
    .update({
      seller_reply: reply,
      seller_replied_at: new Date().toISOString(),
    })
    .eq('id', params.id)

  if (error) {
    return NextResponse.json(
      { success: false, error: { code: 'UPDATE_ERROR', message: error.message } },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
