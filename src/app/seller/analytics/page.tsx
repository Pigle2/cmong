export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, Star, MessageSquare } from 'lucide-react'

export default async function SellerAnalyticsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">통계/분석</h1>
        <div className="rounded-md border bg-muted/30 px-3 py-1.5 text-sm text-muted-foreground">
          기간: 최근 30일
        </div>
      </div>

      {/* 프로토타입 안내 배너 */}
      <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
        프로토타입: 상세 통계 기능은 추후 지원 예정입니다
      </div>

      {/* 매출 통계 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" />
            매출 통계
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center rounded-lg bg-muted/40">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <BarChart3 className="h-8 w-8 opacity-40" />
              <span className="text-sm">매출 그래프는 추후 지원 예정</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 서비스별 통계 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4" />
            서비스별 통계
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">서비스명</th>
                  <th className="pb-3 pr-4 font-medium">조회수</th>
                  <th className="pb-3 pr-4 font-medium">주문수</th>
                  <th className="pb-3 pr-4 font-medium">전환율</th>
                  <th className="pb-3 font-medium">매출</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    등록된 서비스가 없습니다
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 리뷰 분석 */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="h-4 w-4" />
              평점 추이
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-32 items-center justify-center rounded-lg bg-muted/40">
              <span className="text-sm text-muted-foreground">추후 지원 예정</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-4 w-4" />
              주요 키워드
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-32 items-center justify-center rounded-lg bg-muted/40">
              <span className="text-sm text-muted-foreground">추후 지원 예정</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
