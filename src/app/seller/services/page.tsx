export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SellerServicesClient from './client'

export default async function SellerServicesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: services } = await supabase
    .from('services')
    .select('*, packages:service_packages(*), category:categories!category_id(name)')
    .eq('seller_id', user.id)
    .neq('status', 'DELETED')
    .order('created_at', { ascending: false })

  return <SellerServicesClient services={services ?? []} />
}
