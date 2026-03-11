export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { ServiceCard } from '@/components/features/service/service-card'
import { ServiceListCard } from '@/components/features/service/service-list-card'
import { ServiceSearchBar } from '@/components/features/service/service-search-bar'
import { ServiceFilters } from '@/components/features/service/service-filters'
import { ViewToggle } from '@/components/features/service/view-toggle'
import { ITEMS_PER_PAGE } from '@/lib/constants'

interface Props {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function ServicesPage({ searchParams }: Props) {
  const supabase = await createClient()
  const rawQ = ((searchParams.q as string) || '').slice(0, 100)
  // PostgREST 필터 인젝션 방지: 영문, 한글, 숫자, 공백만 허용
  const q = rawQ.replace(/[^a-zA-Z0-9가-힣ㄱ-ㅎㅏ-ㅣ\s]/g, '').trim()
  const category = (searchParams.category as string) || ''
  const ALLOWED_SORTS = ['recommended', 'newest', 'rating', 'orders', 'price_asc', 'price_desc']
  const sortParam = (searchParams.sort as string) || 'recommended'
  const sort = ALLOWED_SORTS.includes(sortParam) ? sortParam : 'recommended'
  const page = Math.max(1, parseInt((searchParams.page as string) || '1') || 1)
  const viewParam = (searchParams.view as string) || 'grid'
  const view = viewParam === 'list' ? 'list' : 'grid'

  // 가격 필터 파라미터 검증 (정수, 0 이상)
  const rawMinPrice = parseInt((searchParams.minPrice as string) || '')
  const rawMaxPrice = parseInt((searchParams.maxPrice as string) || '')
  const minPrice = !isNaN(rawMinPrice) && rawMinPrice >= 0 ? rawMinPrice : null
  const maxPrice = !isNaN(rawMaxPrice) && rawMaxPrice >= 0 ? rawMaxPrice : null

  // 작업일 필터 파라미터 검증 (정수, 1 이상)
  const rawWorkDays = parseInt((searchParams.workDays as string) || '')
  const workDays = !isNaN(rawWorkDays) && rawWorkDays >= 1 ? rawWorkDays : null

  // 평점 필터 파라미터 검증 (소수, 0~5 범위)
  const rawMinRating = parseFloat((searchParams.minRating as string) || '')
  const minRating = !isNaN(rawMinRating) && rawMinRating >= 0 && rawMinRating <= 5 ? rawMinRating : null

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

  // 평점 필터는 services 테이블 컬럼이므로 DB 쿼리에서 처리
  if (minRating !== null) {
    query = query.gte('avg_rating', minRating)
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

  // 가격/작업일 필터가 있을 때는 전체를 가져와서 클라이언트에서 필터링 후 페이지네이션
  // 해당 필터가 없을 때만 DB 레벨 페이지네이션 적용
  const hasPkgFilter = minPrice !== null || maxPrice !== null || workDays !== null
  if (!hasPkgFilter) {
    const from = (page - 1) * ITEMS_PER_PAGE
    query = query.range(from, from + ITEMS_PER_PAGE - 1)
  }

  const [{ data: rawServices, count }, { data: categories }] = await Promise.all([
    query,
    supabase.from('categories').select('*').eq('depth', 0).order('sort_order'),
  ])

  // 패키지 기준 필터링 (가격/작업일)
  function getStandardPrice(service: any): number {
    const packages = service.packages || []
    const standardPkg = packages.find((p: any) => p.tier === 'STANDARD')
    if (standardPkg) return standardPkg.price ?? Infinity
    const prices = packages.map((p: any) => p.price).filter((p: any) => p != null)
    return prices.length > 0 ? Math.min(...prices) : Infinity
  }

  function getMinWorkDays(service: any): number {
    const packages = service.packages || []
    const days = packages.map((p: any) => p.work_days).filter((d: any) => d != null && d > 0)
    return days.length > 0 ? Math.min(...days) : Infinity
  }

  let services = rawServices || []

  if (minPrice !== null) {
    services = services.filter((s: any) => getStandardPrice(s) >= minPrice)
  }
  if (maxPrice !== null) {
    services = services.filter((s: any) => getStandardPrice(s) <= maxPrice)
  }
  if (workDays !== null) {
    services = services.filter((s: any) => getMinWorkDays(s) <= workDays)
  }

  // 가격 정렬: STANDARD 패키지(또는 최저가 패키지)의 price 기준
  if (sort === 'price_asc' || sort === 'price_desc') {
    services = [...services].sort((a: any, b: any) => {
      const priceA = getStandardPrice(a)
      const priceB = getStandardPrice(b)
      return sort === 'price_asc' ? priceA - priceB : priceB - priceA
    })
  }

  // 패키지 필터가 있을 때는 필터링 후 건수/페이지네이션 처리
  const filteredCount = hasPkgFilter ? services.length : (count || 0)
  const totalPages = Math.ceil(filteredCount / ITEMS_PER_PAGE)

  if (hasPkgFilter) {
    const from = (page - 1) * ITEMS_PER_PAGE
    services = services.slice(from, from + ITEMS_PER_PAGE)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <ServiceSearchBar defaultValue={rawQ} />

      <div className="mt-6 flex flex-col gap-6 md:flex-row">
        <aside className="w-full shrink-0 md:w-56">
          <ServiceFilters
            categories={categories || []}
            selectedCategory={category}
            selectedSort={sort}
            selectedMinPrice={minPrice !== null ? String(minPrice) : ''}
            selectedMaxPrice={maxPrice !== null ? String(maxPrice) : ''}
            selectedWorkDays={workDays !== null ? String(workDays) : ''}
            selectedMinRating={minRating !== null ? String(minRating) : ''}
            searchQuery={rawQ}
          />
        </aside>

        <div className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {rawQ ? (
                <>
                  &ldquo;<span className="font-medium text-foreground">{rawQ}</span>&rdquo; 검색결과{' '}
                  <span className="font-medium text-foreground">{filteredCount}</span>건
                </>
              ) : (
                <>
                  총 <span className="font-medium text-foreground">{filteredCount}</span>개의 서비스
                </>
              )}
            </p>
            <Suspense fallback={null}>
              <ViewToggle />
            </Suspense>
          </div>

          {services && services.length > 0 ? (
            <div className={view === 'list' ? 'flex flex-col gap-3' : 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'}>
              {services.map((service: any) =>
                view === 'list' ? (
                  <ServiceListCard key={service.id} service={service} />
                ) : (
                  <ServiceCard key={service.id} service={service} />
                )
              )}
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
                    ...(rawQ && { q: rawQ }),
                    ...(category && { category }),
                    ...(sort !== 'recommended' && { sort }),
                    ...(minPrice !== null && { minPrice: String(minPrice) }),
                    ...(maxPrice !== null && { maxPrice: String(maxPrice) }),
                    ...(workDays !== null && { workDays: String(workDays) }),
                    ...(minRating !== null && { minRating: String(minRating) }),
                    ...(view !== 'grid' && { view }),
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
