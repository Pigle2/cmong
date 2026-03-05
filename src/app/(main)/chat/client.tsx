'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChatRoomList } from '@/components/features/chat/chat-room-list'
import { ChatMessageThread } from '@/components/features/chat/chat-message-thread'

interface ChatPageClientProps {
  sellerId?: string
  serviceId?: string
  initialRooms: any[]
  currentUserId: string
}

export default function ChatPageClient({ sellerId, serviceId, initialRooms, currentUserId }: ChatPageClientProps) {
  const [rooms, setRooms] = useState<any[]>(initialRooms)
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const initialized = useRef(false)

  // 문의하기에서 왔으면 방 찾기/생성
  useEffect(() => {
    if (!sellerId || !serviceId || sellerId === currentUserId || initialized.current) return
    initialized.current = true

    const supabase = createClient()

    const createOrFindRoom = async () => {
      // 기존 방 찾기
      const existing = rooms.find((r: any) =>
        r.room_type === 'INQUIRY' &&
        r.service_id === serviceId &&
        r.participants?.some((p: any) => p.user_id === sellerId)
      )
      if (existing) {
        setSelectedRoom(existing.id)
        return
      }

      // 새 방 생성
      const roomId = crypto.randomUUID()
      const { error: roomErr } = await supabase
        .from('chat_rooms')
        .insert({ id: roomId, room_type: 'INQUIRY', service_id: serviceId })

      if (!roomErr) {
        await supabase.from('chat_participants').insert([
          { room_id: roomId, user_id: currentUserId },
          { room_id: roomId, user_id: sellerId },
        ])
        setSelectedRoom(roomId)
        // 방 목록 갱신
        refreshRooms()
      }
    }

    createOrFindRoom()
  }, [sellerId, serviceId, currentUserId, rooms])

  const refreshRooms = async () => {
    const supabase = createClient()
    const { data: participantRooms } = await supabase
      .from('chat_participants')
      .select('room_id')
      .eq('user_id', currentUserId)

    if (!participantRooms || participantRooms.length === 0) return

    const roomIds = participantRooms.map((p) => p.room_id)
    const { data } = await supabase
      .from('chat_rooms')
      .select(`
        *,
        participants:chat_participants(user_id, user:profiles!user_id(id, nickname, avatar_url)),
        messages:chat_messages(id, content, message_type, created_at, sender_id)
      `)
      .in('id', roomIds)
      .order('updated_at', { ascending: false })

    const enriched = data?.map((room: any) => {
      const otherParticipant = room.participants?.find(
        (p: any) => p.user_id !== currentUserId
      )
      const lastMessage = room.messages
        ?.sort((a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0]
      return { ...room, other_user: otherParticipant?.user, last_message: lastMessage }
    }) || []

    setRooms(enriched)
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-6xl">
      <div className={`w-full border-r md:w-80 ${selectedRoom ? 'hidden md:block' : ''}`}>
        <ChatRoomList rooms={rooms} selectedRoom={selectedRoom} onSelectRoom={setSelectedRoom} loading={loading} />
      </div>
      <div className={`flex-1 ${!selectedRoom ? 'hidden md:flex' : 'flex'}`}>
        {selectedRoom ? (
          <ChatMessageThread roomId={selectedRoom} currentUserId={currentUserId} onBack={() => setSelectedRoom(null)} />
        ) : (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">대화를 선택해주세요</div>
        )}
      </div>
    </div>
  )
}
