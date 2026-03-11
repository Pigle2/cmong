import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params

  if (!UUID_REGEX.test(roomId)) {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: '유효한 채팅방 ID가 필요합니다' } },
      { status: 400 }
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' } }, { status: 401 })
  }

  const admin = createAdminClient()

  // 해당 채팅방 참여자인지 확인
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
    return NextResponse.json({ success: false, error: { code: 'ALREADY_LEFT', message: '이미 나간 채팅방입니다' } }, { status: 400 })
  }

  // 진행 중 주문 확인 (채팅방에 연결된 주문)
  const { data: room } = await admin
    .from('chat_rooms')
    .select('order_id')
    .eq('id', roomId)
    .single()

  if (room?.order_id) {
    const { data: activeOrder } = await admin
      .from('orders')
      .select('id')
      .eq('id', room.order_id)
      .in('status', ['PAID', 'ACCEPTED', 'IN_PROGRESS', 'DELIVERED', 'REVISION_REQUESTED'])
      .single()

    if (activeOrder) {
      return NextResponse.json({ success: false, error: { code: 'ACTIVE_ORDER_EXISTS', message: '진행 중인 주문이 있어 나갈 수 없습니다' } }, { status: 422 })
    }
  }

  // 사용자 닉네임 조회
  const { data: profile } = await admin
    .from('profiles')
    .select('nickname')
    .eq('id', user.id)
    .single()

  const nickname = profile?.nickname || '알 수 없음'

  // chat_participants 업데이트: 비활성화
  const { error: updateError } = await admin
    .from('chat_participants')
    .update({ is_active: false, left_at: new Date().toISOString() })
    .eq('room_id', roomId)
    .eq('user_id', user.id)

  if (updateError) {
    console.error('chat_participants UPDATE error:', updateError)
    return NextResponse.json({ success: false, error: { code: 'LEAVE_ERROR', message: '채팅방 나가기에 실패했습니다' } }, { status: 500 })
  }

  // 시스템 메시지 INSERT
  const { error: messageError } = await admin
    .from('chat_messages')
    .insert({
      room_id: roomId,
      sender_id: null,
      message_type: 'SYSTEM',
      content: `${nickname}님이 나갔습니다`,
    })

  if (messageError) {
    console.error('system message INSERT error:', messageError)
  }

  // 채팅방 updated_at 갱신
  await admin
    .from('chat_rooms')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', roomId)

  return NextResponse.json({ success: true })
}
