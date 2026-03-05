'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { ChatRoomList } from '@/components/features/chat/chat-room-list'
import { ChatMessageThread } from '@/components/features/chat/chat-message-thread'

export default function ChatPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: userLoading } = useUser()
  const supabase = createClient()

  const [rooms, setRooms] = useState<any[]>([])
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sellerId = searchParams.get('seller')
    const serviceId = searchParams.get('service')

    if (sellerId && user && sellerId !== user.id) {
      const findOrCreateRoom = async () => {
        const { data: existing } = await supabase
          .from('chat_rooms')
          .select('id, participants:chat_participants(user_id)')
          .eq('room_type', 'INQUIRY')
          .eq('service_id', serviceId)

        const existingRoom = existing?.find((room: any) =>
          room.participants?.some((p: any) => p.user_id === user.id) &&
          room.participants?.some((p: any) => p.user_id === sellerId)
        )

        if (existingRoom) {
          setSelectedRoom(existingRoom.id)
          return
        }

        const { data: newRoom } = await supabase
          .from('chat_rooms')
          .insert({ room_type: 'INQUIRY', service_id: serviceId })
          .select()
          .single()

        if (newRoom) {
          await supabase.from('chat_participants').insert([
            { room_id: newRoom.id, user_id: user.id },
            { room_id: newRoom.id, user_id: sellerId },
          ])
          setSelectedRoom(newRoom.id)
        }
      }
      findOrCreateRoom()
    }
  }, [searchParams, user])

  useEffect(() => {
    if (!user) return

    const loadRooms = async () => {
      const { data: participantRooms } = await supabase
        .from('chat_participants')
        .select('room_id')
        .eq('user_id', user.id)

      if (!participantRooms || participantRooms.length === 0) {
        setLoading(false)
        return
      }

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

      const enrichedRooms = data?.map((room: any) => {
        const otherParticipant = room.participants?.find(
          (p: any) => p.user_id !== user.id
        )
        const lastMessage = room.messages
          ?.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

        return { ...room, other_user: otherParticipant?.user, last_message: lastMessage }
      }) || []

      setRooms(enrichedRooms)
      setLoading(false)
    }

    loadRooms()
  }, [user])

  if (userLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <p className="text-muted-foreground">로그인이 필요합니다</p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-6xl">
      <div className={`w-full border-r md:w-80 ${selectedRoom ? 'hidden md:block' : ''}`}>
        <ChatRoomList rooms={rooms} selectedRoom={selectedRoom} onSelectRoom={setSelectedRoom} loading={loading} />
      </div>
      <div className={`flex-1 ${!selectedRoom ? 'hidden md:flex' : 'flex'}`}>
        {selectedRoom ? (
          <ChatMessageThread roomId={selectedRoom} currentUserId={user.id} onBack={() => setSelectedRoom(null)} />
        ) : (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">대화를 선택해주세요</div>
        )}
      </div>
    </div>
  )
}
