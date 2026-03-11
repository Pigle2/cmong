export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BuyerOrdersClient } from './client'

export default async function OrdersPage() {
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
      created_at,
      service:services(id, title, thumbnail_url),
      seller:profiles!seller_id(nickname),
      package:service_packages!package_id(name, tier)
    `)
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const all: any[] = orders || []

  const activeOrders = all.filter((o) =>
    ['PAID', 'ACCEPTED', 'IN_PROGRESS', 'DELIVERED', 'REVISION_REQUESTED'].includes(o.status)
  )
  const completedOrders = all.filter((o) => o.status === 'COMPLETED')
  const cancelledOrders = all.filter((o) =>
    ['REJECTED', 'CANCELLED', 'REFUNDED', 'DISPUTED'].includes(o.status)
  )

  return (
    <BuyerOrdersClient
      allOrders={all}
      activeOrders={activeOrders}
      completedOrders={completedOrders}
      cancelledOrders={cancelledOrders}
    />
  )
}
