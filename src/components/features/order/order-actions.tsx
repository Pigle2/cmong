'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'
import Link from 'next/link'

interface OrderActionsProps {
  order: any
  isBuyer: boolean
  isSeller: boolean
  hasReview: boolean
}

export function OrderActions({ order, isBuyer, isSeller, hasReview }: OrderActionsProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [note, setNote] = useState('')

  const updateStatus = async (newStatus: string, actionNote?: string) => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) return

    const { error } = await supabase
      .from('orders')
      .update({
        status: newStatus,
        ...(newStatus === 'COMPLETED' ? { completed_at: new Date().toISOString() } : {}),
      })
      .eq('id', order.id)

    if (error) {
      toast({ title: '상태 변경에 실패했습니다', variant: 'destructive' })
      setLoading(false)
      return
    }

    // Add status history
    await supabase.from('order_status_history').insert({
      order_id: order.id,
      from_status: order.status,
      to_status: newStatus,
      changed_by: user.id,
      note: actionNote || note || null,
    })

    // Create notification
    const targetUserId = isBuyer ? order.seller_id : order.buyer_id
    await supabase.from('notifications').insert({
      user_id: targetUserId,
      type: 'ORDER',
      title: '주문 상태 변경',
      message: `주문 ${order.order_number}의 상태가 변경되었습니다`,
      link: `/orders/${order.id}`,
    })

    toast({ title: '상태가 변경되었습니다' })
    setLoading(false)
    router.refresh()
  }

  const getActions = () => {
    const actions: { label: string; status: string; variant: 'default' | 'outline' | 'destructive' }[] = []

    if (isSeller) {
      if (order.status === 'PAID') {
        actions.push({ label: '수락', status: 'ACCEPTED', variant: 'default' })
        actions.push({ label: '거절', status: 'REJECTED', variant: 'destructive' })
      }
      if (order.status === 'ACCEPTED') {
        actions.push({ label: '작업 시작', status: 'IN_PROGRESS', variant: 'default' })
      }
      if (order.status === 'IN_PROGRESS' || order.status === 'REVISION_REQUESTED') {
        actions.push({ label: '납품하기', status: 'DELIVERED', variant: 'default' })
      }
    }

    if (isBuyer) {
      if (order.status === 'DELIVERED') {
        actions.push({ label: '구매 확정', status: 'COMPLETED', variant: 'default' })
        actions.push({ label: '수정 요청', status: 'REVISION_REQUESTED', variant: 'outline' })
      }
      if (['PAID', 'ACCEPTED'].includes(order.status)) {
        actions.push({ label: '주문 취소', status: 'CANCELLED', variant: 'destructive' })
      }
    }

    return actions
  }

  const actions = getActions()

  if (actions.length === 0 && !(isBuyer && order.status === 'COMPLETED' && !hasReview)) {
    return null
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">주문 관리</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {actions.length > 0 && (
          <>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="메모를 남겨주세요 (선택사항)"
              rows={2}
            />
            <div className="flex flex-wrap gap-2">
              {actions.map((action) => (
                <Button
                  key={action.status}
                  variant={action.variant}
                  onClick={() => updateStatus(action.status)}
                  disabled={loading}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </>
        )}

        {isBuyer && order.status === 'COMPLETED' && !hasReview && (
          <Link href={`/orders/${order.id}/review`}>
            <Button className="w-full">리뷰 작성하기</Button>
          </Link>
        )}
      </CardContent>
    </Card>
  )
}
