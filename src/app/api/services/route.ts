import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const q = (searchParams.get('q') || '').slice(0, 100)
  const category = searchParams.get('category') || ''
  const sort = searchParams.get('sort') || 'recommended'
  const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
  const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '20') || 20), 100)

  let query = supabase
    .from('services')
    .select('*, packages:service_packages(*), seller:profiles!seller_id(nickname, avatar_url)', { count: 'exact' })
    .eq('status', 'ACTIVE')

  if (q) {
    // PostgREST 필터 인젝션 방지: 구분자 문자 제거
    const sanitizedQ = q.replace(/[,()]/g, '')
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

  switch (sort) {
    case 'newest': query = query.order('created_at', { ascending: false }); break
    case 'rating': query = query.order('avg_rating', { ascending: false }); break
    case 'orders': query = query.order('order_count', { ascending: false }); break
    case 'price_asc':
    case 'price_desc':
    default: query = query.order('order_count', { ascending: false })
  }

  const from = (page - 1) * limit
  query = query.range(from, from + limit - 1)

  const { data, count, error } = await query

  if (error) {
    console.error('services query error:', error.message)
    return NextResponse.json({ success: false, error: { code: 'QUERY_ERROR', message: '서비스 조회에 실패했습니다' } }, { status: 500 })
  }

  // 가격 정렬: DB에서 가져온 후 패키지 최저가 기준으로 재정렬
  if (data && (sort === 'price_asc' || sort === 'price_desc')) {
    const getMinPrice = (service: (typeof data)[number]): number => {
      const packages = service.packages as { price: number; package_type?: string }[] | null
      if (!packages || packages.length === 0) return 0
      const standardPkg = packages.find(p => p.package_type === 'STANDARD')
      if (standardPkg) return standardPkg.price
      return Math.min(...packages.map(p => p.price))
    }
    data.sort((a, b) =>
      sort === 'price_asc'
        ? getMinPrice(a) - getMinPrice(b)
        : getMinPrice(b) - getMinPrice(a)
    )
  }

  return NextResponse.json({
    success: true,
    data,
    total: count,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  })
}
