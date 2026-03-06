import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
  }

  const { reason } = await request.json()

  // 진행 중인 주문 확인 (BR-MY-03)
  const { data: activeOrders } = await supabase
    .from('orders')
    .select('id')
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .in('status', ['PAID', 'ACCEPTED', 'IN_PROGRESS', 'DELIVERED', 'REVISION_REQUESTED'])

  if (activeOrders && activeOrders.length > 0) {
    return NextResponse.json(
      { error: '진행 중인 거래가 있어 탈퇴할 수 없습니다' },
      { status: 400 }
    )
  }

  // admin 클라이언트로 계정 삭제
  const adminClient = createAdminClient()
  const { error } = await adminClient.auth.admin.deleteUser(user.id)

  if (error) {
    return NextResponse.json({ error: '계정 삭제에 실패했습니다' }, { status: 500 })
  }

  // 세션 종료
  await supabase.auth.signOut()

  return NextResponse.json({ success: true })
}
