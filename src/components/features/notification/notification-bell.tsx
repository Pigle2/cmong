'use client'

import { useState } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function NotificationBell() {
  const [unreadCount] = useState(0)

  return (
    <Button variant="ghost" size="icon" className="relative">
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Button>
  )
}
