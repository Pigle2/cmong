import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NewServiceClient from './client'

export default async function NewServicePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return <NewServiceClient />
}
