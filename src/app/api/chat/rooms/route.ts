import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' } }, { status: 401 })
  }

  const { sellerId, serviceId, roomType = 'INQUIRY' } = await request.json()

  // Check if room already exists
  const { data: existing } = await supabase
    .from('chat_rooms')
    .select('id, participants:chat_participants(user_id)')
    .eq('room_type', roomType)
    .eq('service_id', serviceId)

  const existingRoom = existing?.find((room: any) =>
    room.participants?.some((p: any) => p.user_id === user.id) &&
    room.participants?.some((p: any) => p.user_id === sellerId)
  )

  if (existingRoom) {
    return NextResponse.json({ success: true, data: { id: existingRoom.id } })
  }

  // Create new room
  const { data: newRoom, error } = await supabase
    .from('chat_rooms')
    .insert({
      room_type: roomType,
      service_id: serviceId || null,
    })
    .select()
    .single()

  if (error || !newRoom) {
    return NextResponse.json({ success: false, error: { code: 'CREATE_ERROR', message: '채팅방 생성에 실패했습니다' } }, { status: 500 })
  }

  await supabase.from('chat_participants').insert([
    { room_id: newRoom.id, user_id: user.id },
    { room_id: newRoom.id, user_id: sellerId },
  ])

  return NextResponse.json({ success: true, data: { id: newRoom.id } })
}
