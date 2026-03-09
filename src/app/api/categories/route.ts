import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('depth')
    .order('sort_order')

  if (error) {
    return NextResponse.json(
      { success: false, error: { code: 'QUERY_ERROR', message: '카테고리 조회에 실패했습니다' } },
      { status: 500 }
    )
  }

  // Build tree structure
  const tree = data
    .filter((c) => c.depth === 0)
    .map((parent) => ({
      ...parent,
      children: data
        .filter((c) => c.parent_id === parent.id && c.depth === 1)
        .map((mid) => ({
          ...mid,
          children: data.filter((c) => c.parent_id === mid.id && c.depth === 2),
        })),
    }))

  return NextResponse.json({ success: true, data: tree })
}
