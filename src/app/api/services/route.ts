import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const q = (searchParams.get('q') || '').slice(0, 100)
  const category = searchParams.get('category') || ''
  const ALLOWED_SORTS = ['recommended', 'newest', 'rating', 'orders', 'price_asc', 'price_desc']
  const sortParam = searchParams.get('sort') || 'recommended'
  const sort = ALLOWED_SORTS.includes(sortParam) ? sortParam : 'recommended'
  const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
  const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '20') || 20), 100)

  // 가격 필터 파라미터 검증 (정수, 0 이상)
  const rawMinPrice = parseInt(searchParams.get('minPrice') || '')
  const rawMaxPrice = parseInt(searchParams.get('maxPrice') || '')
  const minPrice = !isNaN(rawMinPrice) && rawMinPrice >= 0 ? rawMinPrice : null
  const maxPrice = !isNaN(rawMaxPrice) && rawMaxPrice >= 0 ? rawMaxPrice : null

  // 작업일 필터 파라미터 검증 (정수, 1 이상)
  const rawWorkDays = parseInt(searchParams.get('workDays') || '')
  const workDays = !isNaN(rawWorkDays) && rawWorkDays >= 1 ? rawWorkDays : null

  // 평점 필터 파라미터 검증 (소수, 0~5 범위)
  const rawMinRating = parseFloat(searchParams.get('minRating') || '')
  const minRating = !isNaN(rawMinRating) && rawMinRating >= 0 && rawMinRating <= 5 ? rawMinRating : null

  let query = supabase
    .from('services')
    .select('*, packages:service_packages(*), seller:profiles!seller_id(nickname, avatar_url)', { count: 'exact' })
    .eq('status', 'ACTIVE')

  if (q) {
    // PostgREST 필터 인젝션 방지: 영문, 한글, 숫자, 공백만 허용
    const sanitizedQ = q.replace(/[^a-zA-Z0-9가-힣ㄱ-ㅎㅏ-ㅣ\s]/g, '').trim()
    if (sanitizedQ) {
      query = query.or(`title.ilike.%${sanitizedQ}%,description.ilike.%${sanitizedQ}%`)
    }
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
    case 'newest': query = query.order('created_at', { ascending: false }); break
    case 'rating': query = query.order('avg_rating', { ascending: false }); break
    case 'orders': query = query.order('order_count', { ascending: false }); break
    case 'price_asc':
    case 'price_desc':
    default: query = query.order('order_count', { ascending: false }).order('avg_rating', { ascending: false })
  }

  // 패키지 기준 필터가 있을 때는 전체를 가져와서 클라이언트에서 필터링
  const hasPkgFilter = minPrice !== null || maxPrice !== null || workDays !== null
  if (!hasPkgFilter) {
    const from = (page - 1) * limit
    query = query.range(from, from + limit - 1)
  }

  const { data, count, error } = await query

  if (error) {
    console.error('services query error:', error.message)
    return NextResponse.json({ success: false, error: { code: 'QUERY_ERROR', message: '서비스 조회에 실패했습니다' } }, { status: 500 })
  }

  function getStandardPrice(service: Record<string, unknown>): number {
    const packages = service.packages as { price: number; tier?: string }[] | null
    if (!packages || packages.length === 0) return 0
    const standardPkg = packages.find(p => p.tier === 'STANDARD')
    if (standardPkg) return standardPkg.price
    return Math.min(...packages.map(p => p.price))
  }

  function getMinWorkDays(service: Record<string, unknown>): number {
    const packages = service.packages as { work_days: number }[] | null
    if (!packages || packages.length === 0) return Infinity
    const days = packages.map(p => p.work_days).filter(d => d != null && d > 0)
    return days.length > 0 ? Math.min(...days) : Infinity
  }

  let services = data || []

  // 패키지 기준 필터링 (가격/작업일)
  if (minPrice !== null) {
    services = services.filter(s => getStandardPrice(s) >= minPrice)
  }
  if (maxPrice !== null) {
    services = services.filter(s => getStandardPrice(s) <= maxPrice)
  }
  if (workDays !== null) {
    services = services.filter(s => getMinWorkDays(s) <= workDays)
  }

  // 가격 정렬: DB에서 가져온 후 패키지 최저가 기준으로 재정렬
  if (sort === 'price_asc' || sort === 'price_desc') {
    services = [...services].sort((a, b) =>
      sort === 'price_asc'
        ? getStandardPrice(a) - getStandardPrice(b)
        : getStandardPrice(b) - getStandardPrice(a)
    )
  }

  const filteredCount = hasPkgFilter ? services.length : (count || 0)
  const totalPages = Math.ceil(filteredCount / limit)

  if (hasPkgFilter) {
    const from = (page - 1) * limit
    services = services.slice(from, from + limit)
  }

  return NextResponse.json({
    success: true,
    data: services,
    total: filteredCount,
    page,
    limit,
    totalPages,
  })
}
