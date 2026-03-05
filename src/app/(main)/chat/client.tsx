'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { ChatRoomList } from '@/components/features/chat/chat-room-list'
import { ChatMessageThread } from '@/components/features/chat/chat-message-thread'

interface ChatPageClientProps {
  sellerId?: string
  serviceId?: string
}

export default function ChatPageClient({ sellerId, serviceId }: ChatPageClientProps) {
  const { user, loading: userLoading } = useUser()

  const [rooms, setRooms] = useState<any[]>([])
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const initialized = useRef(false)

  useEffect(() => {
    if (!user || initialized.current) return
    initialized.current = true

    const supabase = createClient()

    const run = async () => {
      try {
        // 1. 문의하기에서 왔으면 방 찾기/생성
        if (sellerId && serviceId && sellerId !== user.id) {
          const { data: myRooms } = await supabase
            .from('chat_participants')
            .select('room_id')
            .eq('user_id', user.id)

          let found = false

          if (myRooms && myRooms.length > 0) {
            const roomIds = myRooms.map(p => p.room_id)
            const { data: inquiryRooms } = await supabase
              .from('chat_rooms')
              .select('id, participants:chat_participants(user_id)')
              .in('id', roomIds)
              .eq('room_type', 'INQUIRY')
              .eq('service_id', serviceId)

            const existing = inquiryRooms?.find((r: any) =>
              r.participants?.some((p: any) => p.user_id === sellerId)
            )
            if (existing) {
              setSelectedRoom(existing.id)
              found = true
            }
          }

          if (!found) {
            const roomId = crypto.randomUUID()
            const { error: roomErr } = await supabase
              .from('chat_rooms')
              .insert({ id: roomId, room_type: 'INQUIRY', service_id: serviceId })

            if (!roomErr) {
              await supabase.from('chat_participants').insert([
                { room_id: roomId, user_id: user.id },
                { room_id: roomId, user_id: sellerId },
              ])
              setSelectedRoom(roomId)
            }
          }
        }

        // 2. 방 목록 로드
        const { data: participantRooms } = await supabase
          .from('chat_participants')
          .select('room_id')
          .eq('user_id', user.id)

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
            (p: any) => p.user_id !== user.id
          )
          const lastMessage = room.messages
            ?.sort((a: any, b: any) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0]
          return { ...room, other_user: otherParticipant?.user, last_message: lastMessage }
        }) || []

        setRooms(enrichedRooms)
      } catch (e) {
        console.error('chat init error:', e)
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [user])

  // userLoading 끝났는데 user가 없으면 로그인 필요
  if (!userLoading && !user) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <p className="text-muted-foreground">로그인이 필요합니다</p>
      </div>
    )
  }

  // user가 아직 없으면 (userLoading 중) 채팅 UI 스켈레톤으로 표시
  const isLoading = loading || !user

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-6xl">
      <div className={`w-full border-r md:w-80 ${selectedRoom ? 'hidden md:block' : ''}`}>
        <ChatRoomList rooms={rooms} selectedRoom={selectedRoom} onSelectRoom={setSelectedRoom} loading={isLoading} />
      </div>
      <div className={`flex-1 ${!selectedRoom ? 'hidden md:flex' : 'flex'}`}>
        {selectedRoom && user ? (
          <ChatMessageThread roomId={selectedRoom} currentUserId={user.id} onBack={() => setSelectedRoom(null)} />
        ) : (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">대화를 선택해주세요</div>
        )}
      </div>
    </div>
  )
}
