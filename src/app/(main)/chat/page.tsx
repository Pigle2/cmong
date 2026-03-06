export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ChatPageClient from './client'

interface ChatPageProps {
  searchParams: Promise<{ seller?: string; service?: string }>
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const { seller: sellerId, service: serviceId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    const chatUrl = sellerId && serviceId
      ? `/chat?seller=${sellerId}&service=${serviceId}`
      : '/chat'
    redirect(`/login?redirect=${encodeURIComponent(chatUrl)}`)
  }

  // 서버에서 채팅방 목록 로드 (is_active=true인 참여만)
  const { data: participantRooms } = await supabase
    .from('chat_participants')
    .select('room_id')
    .eq('user_id', user.id)
    .eq('is_active', true)

  let rooms: any[] = []

  if (participantRooms && participantRooms.length > 0) {
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

    rooms = data?.map((room: any) => {
      const otherParticipant = room.participants?.find(
        (p: any) => p.user_id !== user.id
      )
      const lastMessage = room.messages
        ?.sort((a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0]
      return { ...room, other_user: otherParticipant?.user, last_message: lastMessage }
    }) || []
  }

  return (
    <ChatPageClient
      sellerId={sellerId}
      serviceId={serviceId}
      initialRooms={rooms}
      currentUserId={user.id}
    />
  )
}
