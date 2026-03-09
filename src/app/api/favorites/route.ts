import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' } }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('favorites')
    .select('*, service:services(*, packages:service_packages(*), seller:profiles!seller_id(nickname, avatar_url))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('favorites query error:', error.message)
    return NextResponse.json({ success: false, error: { code: 'QUERY_ERROR', message: '찜 목록 조회에 실패했습니다' } }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' } }, { status: 401 })
  }

  const { serviceId } = await request.json()

  if (!serviceId || typeof serviceId !== 'string') {
    return NextResponse.json({ success: false, error: { code: 'BAD_REQUEST', message: 'serviceId가 필요합니다' } }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('service_id', serviceId)
    .single()

  if (existing) {
    const { error: deleteError } = await supabase.from('favorites').delete().eq('id', existing.id)
    if (deleteError) {
      console.error('favorites delete error:', deleteError.message)
      return NextResponse.json({ success: false, error: { code: 'DELETE_ERROR', message: '찜 해제에 실패했습니다' } }, { status: 500 })
    }
    return NextResponse.json({ success: true, data: { favorited: false } })
  }

  const { error: insertError } = await supabase.from('favorites').insert({ user_id: user.id, service_id: serviceId })
  if (insertError) {
    console.error('favorites insert error:', insertError.message)
    return NextResponse.json({ success: false, error: { code: 'INSERT_ERROR', message: '찜 추가에 실패했습니다' } }, { status: 500 })
  }
  return NextResponse.json({ success: true, data: { favorited: true } })
}
