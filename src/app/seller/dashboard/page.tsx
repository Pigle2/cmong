export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, ShoppingCart, Star, DollarSign } from 'lucide-react'

export default async function SellerDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { count: serviceCount } = await supabase
    .from('services')
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', user.id)
    .neq('status', 'DELETED')

  const { count: activeOrderCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', user.id)
    .in('status', ['PAID', 'ACCEPTED', 'IN_PROGRESS', 'DELIVERED', 'REVISION_REQUESTED'])

  const { count: completedOrderCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', user.id)
    .eq('status', 'COMPLETED')

  const { data: sellerProfile } = await supabase
    .from('seller_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const stats = [
    { title: '등록 서비스', value: serviceCount || 0, icon: Package },
    { title: '진행중 주문', value: activeOrderCount || 0, icon: ShoppingCart },
    { title: '완료 주문', value: completedOrderCount || 0, icon: DollarSign },
    { title: '평균 평점', value: sellerProfile ? Number(sellerProfile.avg_rating).toFixed(1) : '0.0', icon: Star },
  ]

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">판매자 대시보드</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
