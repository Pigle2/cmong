'use client'

import { useEffect, useState } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications'
import { createClient } from '@/lib/supabase/client'

export function NotificationBell() {
  const [userId, setUserId] = useState<string | undefined>(undefined)
  const supabase = createClient()

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id)
    }
    fetchUser()
  }, [])

  const { notifications, unreadCount, markAllRead } = useRealtimeNotifications(userId)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <h4 className="text-sm font-semibold">알림</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs text-muted-foreground"
              onClick={markAllRead}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              모두 읽음
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              알림이 없습니다
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notification) => (
                <div key={notification.id}>
                  {notification.link ? (
                    <Link
                      href={notification.link}
                      className={`block px-4 py-3 hover:bg-accent transition-colors ${
                        !notification.is_read ? 'bg-accent/50' : ''
                      }`}
                    >
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.created_at).toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </Link>
                  ) : (
                    <div
                      className={`px-4 py-3 ${
                        !notification.is_read ? 'bg-accent/50' : ''
                      }`}
                    >
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.created_at).toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  )}
                  <Separator />
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
