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
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const prevCountRef = useRef(0)
  const isNearBottomRef = useRef(true)

  // 스크롤 위치 추적: 하단 근처인지 확인
  useEffect(() => {
    const scrollEl = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]')
    if (!scrollEl) return
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollEl
      isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 100
    }
    scrollEl.addEventListener('scroll', handleScroll)
    return () => scrollEl.removeEventListener('scroll', handleScroll)
  }, [loading])

  useEffect(() => {
    if (messages.length > prevCountRef.current) {
      // 첫 로드이거나 하단 근처일 때만 자동 스크롤
      if (prevCountRef.current === 0 || isNearBottomRef.current) {
        bottomRef.current?.scrollIntoView({ behavior: prevCountRef.current === 0 ? 'instant' : 'smooth' })
      }
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

      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
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
