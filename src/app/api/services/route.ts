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
    case 'newest': query = query.order('created_at', { ascending: false }); break
    case 'rating': query = query.order('avg_rating', { ascending: false }); break
    case 'orders': query = query.order('order_count', { ascending: false }); break
    default: query = query.order('order_count', { ascending: false })
  }

  const from = (page - 1) * limit
  query = query.range(from, from + limit - 1)

  const { data, count, error } = await query

  if (error) {
    return NextResponse.json({ success: false, error: { code: 'QUERY_ERROR', message: error.message } }, { status: 500 })
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
