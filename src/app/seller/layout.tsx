'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Toaster } from '@/components/ui/toaster'
import { UserProvider } from '@/hooks/use-user'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Package, ShoppingCart, User, MessageSquare } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/seller/dashboard', icon: LayoutDashboard, label: '대시보드' },
  { href: '/seller/services', icon: Package, label: '서비스 관리' },
  { href: '/seller/orders', icon: ShoppingCart, label: '주문 관리' },
  { href: '/chat', icon: MessageSquare, label: '메시지' },
  { href: '/seller/profile', icon: User, label: '프로필' },
]

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <UserProvider>
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <aside className="hidden w-56 border-r bg-muted/30 md:block">
          <nav className="p-4">
            <h2 className="mb-4 px-3 text-sm font-semibold text-muted-foreground">
              판매자 관리
            </h2>
            <ul className="space-y-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm',
                      pathname.startsWith(item.href)
                        ? 'bg-primary/10 font-medium text-primary'
                        : 'text-muted-foreground hover:bg-muted'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        <main className="flex-1 p-6">{children}</main>
      </div>
      <Toaster />
    </div>
    </UserProvider>
  )
}
