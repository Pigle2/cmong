import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('services')
    .select(`
      *,
      packages:service_packages(*),
      images:service_images(*),
      tags:service_tags(*),
      seller:profiles!seller_id(id, nickname, avatar_url, bio),
      category:categories!category_id(id, name, slug)
    `)
    .eq('id', params.id)
    .single()

  if (error || !data) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: '서비스를 찾을 수 없습니다' } },
      { status: 404 }
    )
  }

  // Increment view count
  await supabase
    .from('services')
    .update({ view_count: (data.view_count || 0) + 1 })
    .eq('id', params.id)

  return NextResponse.json({ success: true, data })
}
