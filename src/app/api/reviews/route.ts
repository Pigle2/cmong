import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const serviceId = searchParams.get('serviceId')

  if (!serviceId) {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: 'serviceId가 필요합니다' } },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('reviews')
    .select('*, reviewer:profiles!reviewer_id(nickname, avatar_url)')
    .eq('service_id', serviceId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json(
      { success: false, error: { code: 'QUERY_ERROR', message: error.message } },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data })
}
