import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params
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
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: '서비스를 찾을 수 없습니다' } },
      { status: 404 }
    )
  }

  // Increment view count with cookie-based dedup to prevent abuse
  const cookieName = `viewed_${id}`
  const alreadyViewed = request.cookies.get(cookieName)

  if (!alreadyViewed) {
    await supabase
      .from('services')
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq('id', id)

    const response = NextResponse.json({ success: true, data })
    response.cookies.set(cookieName, '1', {
      maxAge: 60 * 30, // 30 minutes
      httpOnly: true,
      sameSite: 'lax',
    })
    return response
  }

  return NextResponse.json({ success: true, data })
}
