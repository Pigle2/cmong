export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SellerOrdersClient } from './client'

export default async function SellerOrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      status,
      total_amount,
      requirements,
      created_at,
      due_date,
      service:services(id, title, thumbnail_url),
      buyer:profiles!buyer_id(nickname),
      package:service_packages!package_id(name, tier, work_days)
    `)
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const all: any[] = orders || []

  const pendingOrders = all.filter((o) => o.status === 'PAID')
  const activeOrders = all.filter((o) => ['ACCEPTED', 'IN_PROGRESS'].includes(o.status))
  const deliveredOrders = all.filter((o) => ['DELIVERED', 'REVISION_REQUESTED'].includes(o.status))
  const completedOrders = all.filter((o) => o.status === 'COMPLETED')
  const cancelledOrders = all.filter((o) =>
    ['REJECTED', 'CANCELLED', 'REFUNDED', 'DISPUTED'].includes(o.status)
  )

  return (
    <SellerOrdersClient
      pendingOrders={pendingOrders}
      activeOrders={activeOrders}
      deliveredOrders={deliveredOrders}
      completedOrders={completedOrders}
      cancelledOrders={cancelledOrders}
    />
  )
}
