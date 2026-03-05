'use client'

import Link from 'next/link'
import { useUser } from '@/hooks/use-user'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { UserMenu } from '@/components/features/auth/user-menu'
import { ModeToggle } from '@/components/features/auth/mode-toggle'
import { NotificationBell } from '@/components/features/notification/notification-bell'
import { Search, MessageSquare } from 'lucide-react'

export function Header() {
  const { user, loading } = useUser()
  const mode = useAuthStore((s) => s.mode)

  return (
    <header className="sticky top-0 z-50 border-b bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold text-primary">
            크몽
          </Link>
          <nav className="hidden items-center gap-4 md:flex">
            <Link
              href="/services"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              서비스 찾기
            </Link>
            {mode === 'SELLER' && user && (
              <>
                <Link
                  href="/seller/dashboard"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  판매자 홈
                </Link>
                <Link
                  href="/seller/services"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  서비스 관리
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/services">
            <Button variant="ghost" size="icon" className="md:hidden">
              <Search className="h-5 w-5" />
            </Button>
          </Link>

          {!loading && (
            <>
              {user ? (
                <>
                  <ModeToggle />
                  <Link href="/chat">
                    <Button variant="ghost" size="icon">
                      <MessageSquare className="h-5 w-5" />
                    </Button>
                  </Link>
                  <NotificationBell />
                  <UserMenu />
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login">
                    <Button variant="ghost" size="sm">
                      로그인
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm">회원가입</Button>
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  )
}
