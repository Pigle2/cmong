export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ServiceCard } from '@/components/features/service/service-card'

export default async function FavoritesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: favorites } = await supabase
    .from('favorites')
    .select('*, service:services(*, packages:service_packages(*), seller:profiles!seller_id(nickname, avatar_url))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">찜 목록</h1>

      {favorites && favorites.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((fav: any) =>
            fav.service ? (
              <ServiceCard key={fav.id} service={fav.service} />
            ) : null
          )}
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="text-muted-foreground">찜한 서비스가 없습니다</p>
        </div>
      )}
    </div>
  )
}
