'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { useAuthStore } from '@/stores/auth-store'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, Package, Heart, MessageSquare, Settings, LogOut, Store } from 'lucide-react'

export function UserMenu() {
  const router = useRouter()
  const { user, profile } = useUser()
  const mode = useAuthStore((s) => s.mode)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (!user) return null

  const nickname = profile?.nickname || user.email?.split('@')[0] || '사용자'
  const email = profile?.email || user.email || ''

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus:outline-none">
        <Avatar className="h-9 w-9 border-2 border-primary/30 hover:border-primary transition-colors">
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
            {nickname.slice(0, 2)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{nickname}</span>
            <span className="text-xs text-muted-foreground">
              {email}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {mode === 'SELLER' ? (
          <>
            <DropdownMenuItem onClick={() => router.push('/seller/dashboard')}>
              <Store className="mr-2 h-4 w-4" />
              판매자 대시보드
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/seller/services')}>
              <Package className="mr-2 h-4 w-4" />
              내 서비스 관리
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/seller/orders')}>
              <Package className="mr-2 h-4 w-4" />
              주문 관리
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem onClick={() => router.push('/orders')}>
              <Package className="mr-2 h-4 w-4" />
              주문 내역
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/mypage/favorites')}>
              <Heart className="mr-2 h-4 w-4" />
              찜 목록
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuItem onClick={() => router.push('/chat')}>
          <MessageSquare className="mr-2 h-4 w-4" />
          메시지
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/mypage')}>
          <User className="mr-2 h-4 w-4" />
          마이페이지
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/mypage/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          설정
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
