'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '@/hooks/use-user'
import { useAuthStore } from '@/stores/auth-store'
import { Home, Search, MessageSquare, User, Store } from 'lucide-react'
import { cn } from '@/lib/utils'

export function MobileNav() {
  const pathname = usePathname()
  const { user } = useUser()
  const mode = useAuthStore((s) => s.mode)

  const items = [
    { href: '/', icon: Home, label: '홈' },
    { href: '/services', icon: Search, label: '검색' },
    ...(user
      ? [
          { href: '/chat', icon: MessageSquare, label: '메시지' },
          ...(mode === 'SELLER'
            ? [{ href: '/seller/dashboard', icon: Store, label: '판매관리' }]
            : []),
          { href: '/mypage', icon: User, label: '마이' },
        ]
      : [{ href: '/login', icon: User, label: '로그인' }]),
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <div className="flex items-center justify-around py-2">
        {items.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1 text-xs',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
