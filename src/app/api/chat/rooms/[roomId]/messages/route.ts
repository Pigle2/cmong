import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' } }, { status: 401 })
  }

  // 참여자 검증: 해당 방의 멤버인지 확인
  const { data: participant } = await supabase
    .from('chat_participants')
    .select('id')
    .eq('room_id', roomId)
    .eq('user_id', user.id)
    .single()

  if (!participant) {
    return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: '접근 권한이 없습니다' } }, { status: 403 })
  }

  const { data: messages } = await supabase
    .from('chat_messages')
    .select('*, sender:profiles!sender_id(id, nickname, avatar_url)')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true })

  return NextResponse.json({ success: true, data: messages || [] })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' } }, { status: 401 })
  }

  // 참여자 검증
  const { data: participant } = await supabase
    .from('chat_participants')
    .select('id')
    .eq('room_id', roomId)
    .eq('user_id', user.id)
    .single()

  if (!participant) {
    return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: '접근 권한이 없습니다' } }, { status: 403 })
  }

  const { content } = await request.json()

  if (!content || typeof content !== 'string' || content.trim().length === 0 || content.length > 5000) {
    return NextResponse.json({ success: false, error: { code: 'BAD_REQUEST', message: '유효하지 않은 메시지입니다' } }, { status: 400 })
  }

  const { error } = await supabase.from('chat_messages').insert({
    room_id: roomId,
    sender_id: user.id,
    message_type: 'TEXT',
    content: content.trim(),
  })

  if (error) {
    return NextResponse.json({ success: false, error: { code: 'SEND_ERROR', message: error.message } }, { status: 500 })
  }

  await supabase
    .from('chat_rooms')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', roomId)

  return NextResponse.json({ success: true })
}
