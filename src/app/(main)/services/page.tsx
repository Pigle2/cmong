export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { ServiceCard } from '@/components/features/service/service-card'
import { ServiceSearchBar } from '@/components/features/service/service-search-bar'
import { ServiceFilters } from '@/components/features/service/service-filters'
import { ITEMS_PER_PAGE } from '@/lib/constants'

interface Props {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function ServicesPage({ searchParams }: Props) {
  const supabase = await createClient()
  const q = (searchParams.q as string) || ''
  const category = (searchParams.category as string) || ''
  const sort = (searchParams.sort as string) || 'recommended'
  const page = parseInt((searchParams.page as string) || '1')
  let query = supabase
    .from('services')
    .select(
      '*, packages:service_packages(*), seller:profiles!seller_id(nickname, avatar_url)',
      { count: 'exact' }
    )
    .eq('status', 'ACTIVE')

  if (q) {
    query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`)
  }

  if (category) {
    const { data: allCategories } = await supabase
      .from('categories')
      .select('id, slug, parent_id')
    if (allCategories) {
      const cat = allCategories.find((c) => c.slug === category)
      if (cat) {
        const children = allCategories.filter((c) => c.parent_id === cat.id)
        const childIds = children.map((c) => c.id)
        const grandchildren = allCategories.filter((c) => childIds.includes(c.parent_id))
        const allIds = [cat.id, ...childIds, ...grandchildren.map((c) => c.id)]
        query = query.in('category_id', allIds)
      }
    }
  }

  switch (sort) {
    case 'newest':
      query = query.order('created_at', { ascending: false })
      break
    case 'rating':
      query = query.order('avg_rating', { ascending: false })
      break
    case 'orders':
      query = query.order('order_count', { ascending: false })
      break
    case 'price_asc':
    case 'price_desc':
    default:
      query = query.order('order_count', { ascending: false }).order('avg_rating', { ascending: false })
  }

  const from = (page - 1) * ITEMS_PER_PAGE
  query = query.range(from, from + ITEMS_PER_PAGE - 1)

  const [{ data: rawServices, count }, { data: categories }] = await Promise.all([
    query,
    supabase.from('categories').select('*').eq('depth', 0).order('sort_order'),
  ])
  const totalPages = Math.ceil((count || 0) / ITEMS_PER_PAGE)

  // 가격 정렬: STANDARD 패키지(또는 최저가 패키지)의 price 기준
  let services = rawServices
  if (services && (sort === 'price_asc' || sort === 'price_desc')) {
    const getMinPrice = (service: any) => {
      const packages = service.packages || []
      const standardPkg = packages.find((p: any) => p.package_type === 'STANDARD')
      if (standardPkg) return standardPkg.price ?? Infinity
      const prices = packages.map((p: any) => p.price).filter((p: any) => p != null)
      return prices.length > 0 ? Math.min(...prices) : Infinity
    }
    services = [...services].sort((a: any, b: any) => {
      const priceA = getMinPrice(a)
      const priceB = getMinPrice(b)
      return sort === 'price_asc' ? priceA - priceB : priceB - priceA
    })
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <ServiceSearchBar defaultValue={q} />

      <div className="mt-6 flex flex-col gap-6 md:flex-row">
        <aside className="w-full shrink-0 md:w-56">
          <ServiceFilters
            categories={categories || []}
            selectedCategory={category}
            selectedSort={sort}
          />
        </aside>

        <div className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              총 <span className="font-medium text-foreground">{count || 0}</span>개의 서비스
            </p>
          </div>

          {services && services.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service: any) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-lg font-medium text-muted-foreground">
                검색 결과가 없습니다
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                다른 검색어나 필터를 시도해보세요
              </p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <a
                  key={p}
                  href={`/services?${new URLSearchParams({
                    ...(q && { q }),
                    ...(category && { category }),
                    ...(sort && { sort }),
                    page: p.toString(),
                  }).toString()}`}
                  className={`flex h-9 w-9 items-center justify-center rounded-md text-sm ${
                    p === page
                      ? 'bg-primary text-primary-foreground'
                      : 'border hover:bg-muted'
                  }`}
                >
                  {p}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
