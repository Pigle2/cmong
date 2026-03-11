export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ORDER_STATUS, ORDER_STATUS_COLORS, SELLER_GRADES } from '@/lib/constants'
import { formatPrice, formatDate } from '@/lib/utils'
import { Package, Heart, Star, Settings } from 'lucide-react'

export default async function MyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: sellerProfile } = await supabase
    .from('seller_profiles')
    .select('grade')
    .eq('user_id', user.id)
    .single()

  const { data: recentOrders } = await supabase
    .from('orders')
    .select('*, service:services(title, thumbnail_url)')
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: allOrders } = await supabase
    .from('orders')
    .select('status')
    .eq('buyer_id', user.id)

  const ACTIVE_STATUSES = ['PAID', 'ACCEPTED', 'IN_PROGRESS', 'DELIVERED', 'REVISION_REQUESTED']
  const activeOrderCount = allOrders?.filter((o) => ACTIVE_STATUSES.includes(o.status)).length ?? 0
  const completedOrderCount = allOrders?.filter((o) => o.status === 'COMPLETED').length ?? 0

  const { count: favoriteCount } = await supabase
    .from('favorites')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { count: reviewCount } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('reviewer_id', user.id)

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Profile Card */}
      <Card className="mb-8">
        <CardContent className="flex items-center gap-4 p-6">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="text-lg">{profile?.nickname?.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{profile?.nickname}</h1>
              {sellerProfile?.grade && (
                <Badge variant="secondary" className="text-xs">
                  {SELLER_GRADES[sellerProfile.grade as keyof typeof SELLER_GRADES] ?? sellerProfile.grade}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
            {profile?.bio && <p className="mt-1 text-sm">{profile.bio}</p>}
          </div>
          <Link href="/mypage/settings">
            <Button variant="outline" size="sm" className="gap-1">
              <Settings className="h-4 w-4" />
              설정
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-4 gap-4">
        <Link href="/orders">
          <Card className="text-center transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <Package className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
              <div className="text-2xl font-bold">{activeOrderCount}</div>
              <div className="text-xs text-muted-foreground">진행중</div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/orders">
          <Card className="text-center transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <Package className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
              <div className="text-2xl font-bold">{completedOrderCount}</div>
              <div className="text-xs text-muted-foreground">완료</div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/mypage/favorites">
          <Card className="text-center transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <Heart className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
              <div className="text-2xl font-bold">{favoriteCount || 0}</div>
              <div className="text-xs text-muted-foreground">찜</div>
            </CardContent>
          </Card>
        </Link>
        <Card className="text-center">
          <CardContent className="p-4">
            <Star className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
            <div className="text-2xl font-bold">{reviewCount || 0}</div>
            <div className="text-xs text-muted-foreground">리뷰</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">최근 주문</CardTitle>
          <Link href="/orders" className="text-sm text-primary hover:underline">
            전체보기
          </Link>
        </CardHeader>
        <CardContent>
          {recentOrders && recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((order: any) => (
                <Link key={order.id} href={`/orders/${order.id}`}>
                  <div className="flex items-center gap-3 rounded-md p-2 hover:bg-muted">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-muted">
                      {order.service?.thumbnail_url ? (
                        <img src={order.service.thumbnail_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm">🎨</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{order.service?.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                    </div>
                    <Badge className={`text-xs ${ORDER_STATUS_COLORS[order.status] || ''}`}>
                      {ORDER_STATUS[order.status as keyof typeof ORDER_STATUS]}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">주문 내역이 없습니다</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
