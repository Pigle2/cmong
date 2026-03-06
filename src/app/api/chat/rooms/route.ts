import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' } }, { status: 401 })
  }

  const { sellerId, serviceId, roomType = 'INQUIRY' } = await request.json()

  // 입력값 검증
  if (!sellerId || typeof sellerId !== 'string') {
    return NextResponse.json({ success: false, error: { code: 'BAD_REQUEST', message: 'sellerId가 필요합니다' } }, { status: 400 })
  }

  if (!['INQUIRY', 'ORDER'].includes(roomType)) {
    return NextResponse.json({ success: false, error: { code: 'BAD_REQUEST', message: '잘못된 roomType입니다' } }, { status: 400 })
  }

  if (sellerId === user.id) {
    return NextResponse.json({ success: false, error: { code: 'BAD_REQUEST', message: '자기 자신과 채팅방을 만들 수 없습니다' } }, { status: 400 })
  }

  // Admin client로 RLS 우회 (서버에서 검증 후 사용)
  const admin = createAdminClient()

  // sellerId 존재 확인
  const { data: seller } = await admin.from('profiles').select('id').eq('id', sellerId).single()
  if (!seller) {
    return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: '존재하지 않는 사용자입니다' } }, { status: 404 })
  }

  // Check if room already exists
  const { data: existing } = await admin
    .from('chat_rooms')
    .select('id, participants:chat_participants(user_id)')
    .eq('room_type', roomType)
    .eq('service_id', serviceId)

  const existingRoom = existing?.find((room: any) =>
    room.participants?.some((p: any) => p.user_id === user.id) &&
    room.participants?.some((p: any) => p.user_id === sellerId)
  )

  if (existingRoom) {
    // 나간 상태(is_active=false)면 재입장 처리
    const { data: myParticipant } = await admin
      .from('chat_participants')
      .select('id, is_active')
      .eq('room_id', existingRoom.id)
      .eq('user_id', user.id)
      .single()

    if (myParticipant && !myParticipant.is_active) {
      await admin
        .from('chat_participants')
        .update({ is_active: true, rejoined_at: new Date().toISOString(), left_at: null })
        .eq('id', myParticipant.id)
    }

    return NextResponse.json({ success: true, data: { id: existingRoom.id } })
  }

  // Create new room
  const { data: newRoom, error } = await admin
    .from('chat_rooms')
    .insert({
      room_type: roomType,
      service_id: serviceId || null,
    })
    .select()
    .single()

  if (error || !newRoom) {
    console.error('chat_rooms INSERT error:', error)
    return NextResponse.json({ success: false, error: { code: 'CREATE_ERROR', message: '채팅방 생성에 실패했습니다' } }, { status: 500 })
  }

  // 참여자 추가
  const { error: participantError } = await admin.from('chat_participants').insert([
    { room_id: newRoom.id, user_id: user.id },
    { room_id: newRoom.id, user_id: sellerId },
  ])

  if (participantError) {
    console.error('chat_participants INSERT error:', participantError)
  }

  return NextResponse.json({ success: true, data: { id: newRoom.id } })
}
