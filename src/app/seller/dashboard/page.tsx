export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp,
  ShoppingCart,
  Clock,
  Award,
  MessageSquare,
  Star,
  AlertCircle,
  ArrowRight,
} from 'lucide-react'
import { ORDER_STATUS, ORDER_STATUS_COLORS, SELLER_GRADES } from '@/lib/constants'
import { formatPrice, formatDate } from '@/lib/utils'

type OrderRow = {
  id: number
  order_number: string
  status: string
  total_amount: number
  created_at: string
  service: { id: number; title: string } | null
}

export default async function SellerDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 이번 달 범위 계산
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

  // 병렬로 모든 데이터 조회
  const [
    monthlyRevenueResult,
    pendingOrdersResult,
    activeOrdersResult,
    sellerProfileResult,
    recentOrdersResult,
    unreadNotificationsResult,
  ] = await Promise.all([
    // 이번 달 매출 (COMPLETED 주문 합산)
    supabase
      .from('orders')
      .select('total_amount')
      .eq('seller_id', user.id)
      .eq('status', 'COMPLETED')
      .gte('created_at', monthStart)
      .lte('created_at', monthEnd),

    // 대기중 주문 (PAID — 수락 전)
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', user.id)
      .eq('status', 'PAID'),

    // 진행중 주문 (ACCEPTED, IN_PROGRESS, DELIVERED, REVISION_REQUESTED)
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', user.id)
      .in('status', ['ACCEPTED', 'IN_PROGRESS', 'DELIVERED', 'REVISION_REQUESTED']),

    // 판매자 프로필 (등급, 응답률, 평균 평점)
    supabase.from('seller_profiles').select('grade, response_rate, avg_rating').eq('user_id', user.id).single(),

    // 최근 주문 5건
    supabase
      .from('orders')
      .select('id, order_number, status, total_amount, created_at, service:services(id, title)')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),

    // 읽지 않은 알림 수
    supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false),
  ])

  // 이번 달 매출 합산
  const monthlyRevenue = (monthlyRevenueResult.data ?? []).reduce(
    (sum, row) => sum + (row.total_amount ?? 0),
    0,
  )

  const pendingCount = pendingOrdersResult.count ?? 0
  const activeCount = activeOrdersResult.count ?? 0
  const sellerProfile = sellerProfileResult.data
  const recentOrders = (recentOrdersResult.data ?? []) as unknown as OrderRow[]
  const unreadCount = unreadNotificationsResult.count ?? 0

  const grade = sellerProfile?.grade ?? 'NEW'
  const gradeLabel = SELLER_GRADES[grade as keyof typeof SELLER_GRADES] ?? grade
  const responseRate = sellerProfile?.response_rate != null ? `${Number(sellerProfile.response_rate).toFixed(0)}%` : '-'
  const avgRating = sellerProfile?.avg_rating != null ? Number(sellerProfile.avg_rating).toFixed(1) : '0.0'

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">대시보드</h1>

      {/* 1차 통계 카드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">이번 달 매출</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(monthlyRevenue)}</div>
            <p className="mt-1 text-xs text-muted-foreground">확정된 주문 기준</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">진행중 주문</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}건</div>
            <p className="mt-1 text-xs text-muted-foreground">수락 ~ 납품 완료</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">대기중 주문</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}건</div>
            <p className="mt-1 text-xs text-muted-foreground">수락 전 결제 완료</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">등급</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gradeLabel}</div>
            <p className="mt-1 text-xs text-muted-foreground">현재 판매자 등급</p>
          </CardContent>
        </Card>
      </div>

      {/* 2차 통계 카드 (보조 지표) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">응답률</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">{responseRate}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">평균 평점</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">{avgRating}</div>
          </CardContent>
        </Card>
      </div>

      {/* 할 일 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle className="h-4 w-4" />
            할 일
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingCount > 0 ? (
            <div className="flex items-center justify-between rounded-lg bg-amber-50 px-4 py-3 dark:bg-amber-950/20">
              <div className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                새 주문 {pendingCount}건 확인 필요
              </div>
              <Link
                href="/seller/orders"
                className="flex items-center gap-1 text-xs font-medium text-amber-700 hover:underline dark:text-amber-400"
              >
                확인 <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ) : (
            <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
              대기중인 새 주문이 없습니다.
            </div>
          )}

          {unreadCount > 0 && (
            <div className="flex items-center justify-between rounded-lg bg-blue-50 px-4 py-3 dark:bg-blue-950/20">
              <div className="flex items-center gap-2 text-sm font-medium text-blue-800 dark:text-blue-400">
                <MessageSquare className="h-4 w-4 shrink-0" />
                읽지 않은 알림 {unreadCount}건
              </div>
              <Link
                href="/notifications"
                className="flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline dark:text-blue-400"
              >
                확인 <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 최근 주문 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">최근 주문</CardTitle>
          <Link
            href="/seller/orders"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            전체보기 <ArrowRight className="h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">주문 내역이 없습니다.</p>
          ) : (
            <div className="divide-y">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/seller/orders/${order.id}`}
                  className="flex items-center justify-between gap-4 py-3 hover:bg-muted/50 -mx-6 px-6 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">{order.order_number}</span>
                      <Badge
                        className={`text-xs ${ORDER_STATUS_COLORS[order.status] ?? ''}`}
                        variant="outline"
                      >
                        {ORDER_STATUS[order.status as keyof typeof ORDER_STATUS] ?? order.status}
                      </Badge>
                    </div>
                    <p className="mt-0.5 truncate text-sm font-medium">
                      {order.service?.title ?? '(삭제된 서비스)'}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold">{formatPrice(order.total_amount)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
