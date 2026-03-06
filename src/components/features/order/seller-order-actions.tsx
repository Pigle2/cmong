'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'

interface SellerOrderActionsProps {
  order: any
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  PAID: ['ACCEPTED', 'REJECTED'],
  ACCEPTED: ['IN_PROGRESS'],
  IN_PROGRESS: ['DELIVERED'],
  REVISION_REQUESTED: ['DELIVERED'],
}

const ACTION_LABELS: Record<string, { label: string; variant: 'default' | 'outline' | 'destructive' }> = {
  ACCEPTED: { label: '주문 수락', variant: 'default' },
  REJECTED: { label: '주문 거절', variant: 'destructive' },
  IN_PROGRESS: { label: '작업 시작', variant: 'default' },
  DELIVERED: { label: '납품하기', variant: 'default' },
}

export function SellerOrderActions({ order }: SellerOrderActionsProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [note, setNote] = useState('')

  const updateStatus = async (newStatus: string) => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) return

      // DB에서 최신 상태 재확인
      const { data: currentOrder, error: fetchError } = await supabase
        .from('orders')
        .select('status')
        .eq('id', order.id)
        .single()

      if (fetchError || !currentOrder) {
        toast({ title: '주문 정보를 불러올 수 없습니다', variant: 'destructive' })
        return
      }

      const allowed = VALID_TRANSITIONS[currentOrder.status] || []
      if (!allowed.includes(newStatus)) {
        toast({
          title: '상태 변경 불가',
          description: `현재 상태에서 변경할 수 없습니다`,
          variant: 'destructive',
        })
        router.refresh()
        return
      }

      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', order.id)

      if (error) {
        toast({ title: '상태 변경에 실패했습니다', variant: 'destructive' })
        return
      }

      await supabase.from('order_status_history').insert({
        order_id: order.id,
        from_status: currentOrder.status,
        to_status: newStatus,
        changed_by: user.id,
        note: note || null,
      })

      await supabase.from('notifications').insert({
        user_id: order.buyer_id,
        type: 'ORDER',
        title: '주문 상태 변경',
        message: `주문 ${order.order_number}의 상태가 변경되었습니다`,
        link: `/orders/${order.id}`,
      })

      toast({ title: '상태가 변경되었습니다' })
      setNote('')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const allowedStatuses = VALID_TRANSITIONS[order.status] || []
  if (allowedStatuses.length === 0) return null

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">주문 처리</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="구매자에게 전달할 메모 (선택사항)"
          rows={2}
        />
        <div className="flex flex-wrap gap-2">
          {allowedStatuses.map((status) => {
            const action = ACTION_LABELS[status]
            if (!action) return null
            return (
              <Button
                key={status}
                variant={action.variant}
                onClick={() => updateStatus(status)}
                disabled={loading}
              >
                {action.label}
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
