export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Wallet, Clock, TrendingUp, CreditCard } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

export default async function SellerSettlementPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">정산 관리</h1>

      {/* 프로토타입 안내 배너 */}
      <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
        프로토타입: 실제 정산 기능은 추후 지원 예정입니다
      </div>

      {/* 통계 카드 3개 */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">가용 잔액</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-2xl font-bold">{formatPrice(0)}</div>
            <Button size="sm" disabled className="w-full">
              출금요청
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">정산 대기</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(0)}</div>
            <p className="mt-1 text-xs text-muted-foreground">구매 확정 후 정산</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">누적 수익</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(0)}</div>
            <p className="mt-1 text-xs text-muted-foreground">전체 기간 합산</p>
          </CardContent>
        </Card>
      </div>

      {/* 정산 내역 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">정산 내역</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">일자</th>
                  <th className="pb-3 pr-4 font-medium">주문번호</th>
                  <th className="pb-3 pr-4 font-medium">금액</th>
                  <th className="pb-3 pr-4 font-medium">수수료</th>
                  <th className="pb-3 font-medium">정산</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    정산 내역이 없습니다
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 계좌 정보 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4" />
            계좌 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">정산 계좌:</span>
            <Badge variant="outline">미등록</Badge>
          </div>
          <Button size="sm" disabled>
            계좌 등록
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
