import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

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

  const admin = createAdminClient()

  // 참여자 검증: 해당 방의 멤버인지 확인
  const { data: participant } = await admin
    .from('chat_participants')
    .select('id, rejoined_at')
    .eq('room_id', roomId)
    .eq('user_id', user.id)
    .single()

  if (!participant) {
    return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: '접근 권한이 없습니다' } }, { status: 403 })
  }

  // 메시지 조회 (재입장한 경우 rejoined_at 이후 메시지만)
  let query = admin
    .from('chat_messages')
    .select('*, sender:profiles!sender_id(id, nickname, avatar_url)')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true })

  if (participant.rejoined_at) {
    query = query.gte('created_at', participant.rejoined_at)
  }

  const { data: messages } = await query

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

  const admin = createAdminClient()

  // 참여자 검증
  const { data: participant } = await admin
    .from('chat_participants')
    .select('id, is_active')
    .eq('room_id', roomId)
    .eq('user_id', user.id)
    .single()

  if (!participant) {
    return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: '접근 권한이 없습니다' } }, { status: 403 })
  }

  if (!participant.is_active) {
    return NextResponse.json({ success: false, error: { code: 'LEFT_ROOM', message: '나간 채팅방에는 메시지를 보낼 수 없습니다' } }, { status: 403 })
  }

  let msgBody
  try {
    msgBody = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: { code: 'BAD_REQUEST', message: '잘못된 요청입니다' } }, { status: 400 })
  }
  const { content } = msgBody

  if (!content || typeof content !== 'string' || content.trim().length === 0 || content.length > 5000) {
    return NextResponse.json({ success: false, error: { code: 'BAD_REQUEST', message: '유효하지 않은 메시지입니다' } }, { status: 400 })
  }

  // 상대방이 나간 상태(is_active=false)면 자동 재입장 처리
  // SELECT+UPDATE 대신 조건부 UPDATE 한 번으로 원자적 처리 (TOCTOU 방지)
  await admin
    .from('chat_participants')
    .update({ is_active: true, rejoined_at: new Date().toISOString(), left_at: null })
    .eq('room_id', roomId)
    .neq('user_id', user.id)
    .eq('is_active', false)

  const { error } = await admin.from('chat_messages').insert({
    room_id: roomId,
    sender_id: user.id,
    message_type: 'TEXT',
    content: content.trim(),
  })

  if (error) {
    console.error('chat message send error:', error.message)
    return NextResponse.json({ success: false, error: { code: 'SEND_ERROR', message: '메시지 전송에 실패했습니다' } }, { status: 500 })
  }

  await admin
    .from('chat_rooms')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', roomId)

  return NextResponse.json({ success: true })
}
