import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SellerProfileClient from './client'

export default async function SellerProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return <SellerProfileClient />
}
