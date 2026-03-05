'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { ChatRoomList } from '@/components/features/chat/chat-room-list'
import { ChatMessageThread } from '@/components/features/chat/chat-message-thread'

export default function ChatPageClient() {
  const searchParams = useSearchParams()
  const { user, loading: userLoading } = useUser()
  const supabase = createClient()

  const [rooms, setRooms] = useState<any[]>([])
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadRooms = useCallback(async (userId: string) => {
    try {
      const { data: participantRooms } = await supabase
        .from('chat_participants')
        .select('room_id')
        .eq('user_id', userId)

      if (!participantRooms || participantRooms.length === 0) {
        setRooms([])
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
          (p: any) => p.user_id !== userId
        )
        const lastMessage = room.messages
          ?.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

        return { ...room, other_user: otherParticipant?.user, last_message: lastMessage }
      }) || []

      setRooms(enrichedRooms)
    } catch (e) {
      console.error('loadRooms error:', e)
      setRooms([])
    }
  }, [supabase])

  // Single effect: find/create room if needed, then load all rooms
  useEffect(() => {
    if (!user) return

    const init = async () => {
      try {
        const sellerId = searchParams.get('seller')
        const serviceId = searchParams.get('service')

        // If coming from "문의하기", find or create room first
        if (sellerId && serviceId && sellerId !== user.id) {
          await findOrCreateRoom(user.id, sellerId, serviceId)
        }

        // Then load all rooms
        await loadRooms(user.id)
      } catch (e) {
        console.error('chat init error:', e)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [user, searchParams, loadRooms])

  const findOrCreateRoom = async (userId: string, sellerId: string, serviceId: string) => {
    try {
      // Query rooms the current user participates in
      const { data: participantRooms } = await supabase
        .from('chat_participants')
        .select('room_id')
        .eq('user_id', userId)

      if (participantRooms && participantRooms.length > 0) {
        const roomIds = participantRooms.map(p => p.room_id)

        // Check if there's already an INQUIRY room for this service with this seller
        const { data: existingRooms } = await supabase
          .from('chat_rooms')
          .select('id, participants:chat_participants(user_id)')
          .in('id', roomIds)
          .eq('room_type', 'INQUIRY')
          .eq('service_id', serviceId)

        const existingRoom = existingRooms?.find((room: any) =>
          room.participants?.some((p: any) => p.user_id === sellerId)
        )

        if (existingRoom) {
          setSelectedRoom(existingRoom.id)
          return
        }
      }

      // Create new room
      const { data: newRoom, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({ room_type: 'INQUIRY', service_id: serviceId })
        .select()
        .single()

      if (roomError) {
        console.error('Create room error:', roomError)
        return
      }

      if (newRoom) {
        const { error: partError } = await supabase
          .from('chat_participants')
          .insert([
            { room_id: newRoom.id, user_id: userId },
            { room_id: newRoom.id, user_id: sellerId },
          ])

        if (partError) {
          console.error('Create participants error:', partError)
          return
        }

        setSelectedRoom(newRoom.id)
      }
    } catch (e) {
      console.error('findOrCreateRoom error:', e)
    }
  }

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
