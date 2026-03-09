import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NewOrderClient from './client'

export default async function NewOrderPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <Suspense fallback={<div className="py-20 text-center text-muted-foreground">로딩 중...</div>}>
      <NewOrderClient />
    </Suspense>
  )
}
