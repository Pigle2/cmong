import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { ChatMessage } from '@/types'

interface ChatMessageBubbleProps {
  message: ChatMessage & { sender?: any }
  isOwn: boolean
}

export function ChatMessageBubble({ message, isOwn }: ChatMessageBubbleProps) {
  const time = new Date(message.created_at).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  if (message.message_type === 'SYSTEM') {
    return (
      <div className="py-2 text-center text-xs text-muted-foreground">
        ── {message.content} ──
      </div>
    )
  }

  return (
    <div className={cn('flex gap-2', isOwn && 'flex-row-reverse')}>
      {!isOwn && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={message.sender?.avatar_url || undefined} />
          <AvatarFallback className="text-xs">
            {message.sender?.nickname?.slice(0, 2) || '??'}
          </AvatarFallback>
        </Avatar>
      )}
      <div className={cn('max-w-[70%]', isOwn && 'items-end')}>
        {!isOwn && (
          <p className="mb-1 text-xs text-muted-foreground">
            {message.sender?.nickname}
          </p>
        )}
        <div
          className={cn(
            'rounded-2xl px-4 py-2 text-sm',
            isOwn
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted'
          )}
        >
          {message.content}
        </div>
        <p className={cn('mt-1 text-xs text-muted-foreground', isOwn && 'text-right')}>
          {time}
        </p>
      </div>
    </div>
  )
}
