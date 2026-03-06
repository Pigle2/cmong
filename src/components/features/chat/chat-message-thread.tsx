'use client'

import { useRef, useEffect, useState } from 'react'
import { useRealtimeMessages } from '@/hooks/use-realtime-messages'
import { ChatMessageBubble } from '@/components/features/chat/chat-message-bubble'
import { ChatInput } from '@/components/features/chat/chat-input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ArrowLeft, MoreVertical, LogOut } from 'lucide-react'

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
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const [leaveLoading, setLeaveLoading] = useState(false)
  const [leaveError, setLeaveError] = useState<string | null>(null)

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

  const handleLeave = async () => {
    setLeaveLoading(true)
    setLeaveError(null)
    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/leave`, { method: 'POST' })
      const body = await res.json()
      if (body.success) {
        setLeaveDialogOpen(false)
        onBack()
      } else {
        const errorMessages: Record<string, string> = {
          ACTIVE_ORDER_EXISTS: '진행 중인 주문이 있어 나갈 수 없습니다',
          ACTIVE_DISPUTE_EXISTS: '진행 중인 분쟁이 있어 나갈 수 없습니다',
          ALREADY_LEFT: '이미 나간 채팅방입니다',
        }
        setLeaveError(errorMessages[body.error?.code] || body.error?.message || '채팅방 나가기에 실패했습니다')
      }
    } catch {
      setLeaveError('네트워크 오류가 발생했습니다')
    } finally {
      setLeaveLoading(false)
    }
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-center gap-2 border-b p-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <span className="flex-1 font-medium">대화</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setLeaveDialogOpen(true)}
            >
              <LogOut className="mr-2 h-4 w-4" />
              채팅방 나가기
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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

      <AlertDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>채팅방 나가기</AlertDialogTitle>
            <AlertDialogDescription>
              채팅방을 나가면 대화 내용이 목록에서 삭제됩니다. 상대방이 메시지를 보내면 다시 입장됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {leaveError && (
            <p className="text-sm text-destructive">{leaveError}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={leaveLoading}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeave}
              disabled={leaveLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {leaveLoading ? '나가는 중...' : '나가기'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
