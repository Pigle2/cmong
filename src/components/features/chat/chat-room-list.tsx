'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/utils'

interface ChatRoomListProps {
  rooms: any[]
  selectedRoom: string | null
  onSelectRoom: (id: string) => void
  loading: boolean
}

export function ChatRoomList({
  rooms,
  selectedRoom,
  onSelectRoom,
  loading,
}: ChatRoomListProps) {
  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <h2 className="text-lg font-bold">메시지</h2>
      </div>
      <ScrollArea className="flex-1">
        {rooms.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted-foreground">
            대화가 없습니다
          </p>
        ) : (
          rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => onSelectRoom(room.id)}
              className={cn(
                'flex w-full items-center gap-3 border-b p-4 text-left transition-colors hover:bg-muted',
                selectedRoom === room.id && 'bg-muted'
              )}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={room.other_user?.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {room.other_user?.nickname?.slice(0, 2) || '??'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {room.other_user?.nickname || '알 수 없음'}
                  </span>
                  <div className="flex items-center gap-2">
                    {room.unread_count > 0 && (
                      <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                        {room.unread_count > 99 ? '99+' : room.unread_count}
                      </span>
                    )}
                    {room.last_message && (
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(room.last_message.created_at)}
                      </span>
                    )}
                  </div>
                </div>
                <p className={cn(
                  'truncate text-xs',
                  room.unread_count > 0 ? 'font-medium text-foreground' : 'text-muted-foreground'
                )}>
                  {room.last_message?.content || '대화를 시작하세요'}
                </p>
              </div>
            </button>
          ))
        )}
      </ScrollArea>
    </div>
  )
}
