'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  const [loading, setLoading] = useState(false)
  const [note, setNote] = useState('')

  const updateStatus = async (newStatus: string) => {
    setLoading(true)
    try {
      // DELIVERED는 전용 API Route 사용
      const endpoint = newStatus === 'DELIVERED'
        ? `/api/orders/${order.id}/deliver`
        : `/api/orders/${order.id}/status`

      const body = newStatus === 'DELIVERED'
        ? { note: note || null }
        : { status: newStatus, note: note || null }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!json.success) {
        toast({ title: json.error?.message || '상태 변경에 실패했습니다', variant: 'destructive' })
        router.refresh()
        return
      }
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
