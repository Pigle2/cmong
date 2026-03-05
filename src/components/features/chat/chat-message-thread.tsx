'use client'

import { useRef, useEffect } from 'react'
import { useRealtimeMessages } from '@/hooks/use-realtime-messages'
import { ChatMessageBubble } from '@/components/features/chat/chat-message-bubble'
import { ChatInput } from '@/components/features/chat/chat-input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ArrowLeft } from 'lucide-react'

interface ChatMessageThreadProps {
  roomId: string
  currentUserId: string
  onBack: () => void
}

export function ChatMessageThread({
  roomId,
  currentUserId,
  onBack,
}: ChatMessageThreadProps) {
  const { messages, loading, refetch } = useRealtimeMessages(roomId)
  const bottomRef = useRef<HTMLDivElement>(null)
  const prevCountRef = useRef(0)

  useEffect(() => {
    // 새 메시지가 추가됐을 때만 스크롤 (폴링으로 같은 데이터 받으면 무시)
    if (messages.length > prevCountRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    prevCountRef.current = messages.length
  }, [messages])

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-center gap-2 border-b p-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <span className="font-medium">대화</span>
      </div>

      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <p className="text-sm text-muted-foreground">메시지 로딩 중...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <p className="text-sm text-muted-foreground">첫 메시지를 보내보세요</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <ChatMessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.sender_id === currentUserId}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      <ChatInput roomId={roomId} currentUserId={currentUserId} onMessageSent={refetch} />
    </div>
  )
}
