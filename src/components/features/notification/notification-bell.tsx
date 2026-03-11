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
import type { Notification, NotificationType } from '@/types'

// 안전한 링크인지 검증 (상대경로만 허용, javascript: 등 차단)
function isSafeLink(link: string): boolean {
  return link.startsWith('/')
}

type TabKey = 'ALL' | 'ORDER' | 'MESSAGE' | 'SYSTEM'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: 'ORDER', label: '주문' },
  { key: 'MESSAGE', label: '메시지' },
  { key: 'SYSTEM', label: '시스템' },
]

function filterByTab(notifications: Notification[], tab: TabKey): Notification[] {
  if (tab === 'ALL') return notifications
  if (tab === 'ORDER') return notifications.filter((n) => n.type === 'ORDER')
  if (tab === 'MESSAGE') return notifications.filter((n) => n.type === 'CHAT')
  // SYSTEM: REVIEW + SYSTEM
  return notifications.filter((n) => n.type === 'REVIEW' || n.type === 'SYSTEM')
}

function NotificationItem({ notification }: { notification: Notification }) {
  const content = (
    <>
      <p className="text-sm font-medium">{notification.title}</p>
      <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
      <p className="text-xs text-muted-foreground mt-1">
        {new Date(notification.created_at).toLocaleDateString('ko-KR', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </p>
    </>
  )

  const baseClass = `px-4 py-3 transition-colors ${!notification.is_read ? 'bg-accent/50' : ''}`

  if (notification.link && isSafeLink(notification.link)) {
    return (
      <Link href={notification.link} className={`block hover:bg-accent ${baseClass}`}>
        {content}
      </Link>
    )
  }

  return <div className={baseClass}>{content}</div>
}

export function NotificationBell() {
  const [userId, setUserId] = useState<string | undefined>(undefined)
  const [activeTab, setActiveTab] = useState<TabKey>('ALL')
  const supabase = createClient()

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id)
    }
    fetchUser()
  }, [])

  const { notifications, unreadCount, markAllRead } = useRealtimeNotifications(userId)

  const filtered = filterByTab(notifications, activeTab)

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

        {/* 탭 필터 */}
        <div className="flex border-b">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <ScrollArea className="h-[280px]">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              알림이 없습니다
            </div>
          ) : (
            <div className="flex flex-col">
              {filtered.map((notification) => (
                <div key={notification.id}>
                  <NotificationItem notification={notification} />
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
