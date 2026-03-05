export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EditServiceClient from './client'

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: service, error } = await supabase
    .from('services')
    .select('*, packages:service_packages(*), tags:service_tags(*)')
    .eq('id', id)
    .single()

  if (error || !service || service.seller_id !== user.id) {
    redirect('/seller/services')
  }

  return <EditServiceClient service={service} />
}
