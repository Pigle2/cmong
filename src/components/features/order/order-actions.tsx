'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'
import { CancelOrderModal } from './cancel-order-modal'
import Link from 'next/link'

interface OrderActionsProps {
  order: any
  isBuyer: boolean
  isSeller: boolean
  hasReview: boolean
}

export function OrderActions({ order, isBuyer, isSeller, hasReview }: OrderActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [note, setNote] = useState('')
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [deliverNote, setDeliverNote] = useState('')
  const [revisionNote, setRevisionNote] = useState('')

  // 일반 상태 전환 (취소/납품/확인 제외) - API Route 사용
  const updateStatus = async (newStatus: string, actionNote?: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, note: actionNote || note || null }),
      })
      const json = await res.json()
      if (!json.success) {
        toast({ title: json.error?.message || '상태 변경에 실패했습니다', variant: 'destructive' })
        return
      }
      toast({ title: '상태가 변경되었습니다' })
      setNote('')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  // 취소 처리 (API route 사용)
  const handleCancel = async (reason: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/orders/${order.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      const json = await res.json()
      if (!json.success) {
        toast({ title: json.error?.message || '취소에 실패했습니다', variant: 'destructive' })
        return
      }
      toast({ title: `주문이 취소되었습니다 (환불율: ${json.data.refundRate}%)` })
      setCancelModalOpen(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  // 납품 처리 (판매자)
  const handleDeliver = async () => {
    setLoading(true)
    const res = await fetch(`/api/orders/${order.id}/deliver`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: deliverNote }),
    })
    const json = await res.json()
    if (!json.success) {
      toast({ title: json.error?.message || '납품에 실패했습니다', variant: 'destructive' })
      setLoading(false)
      return
    }
    toast({ title: '납품이 완료되었습니다' })
    setDeliverNote('')
    setLoading(false)
    router.refresh()
  }

  // 구매 확정 (구매자)
  const handleConfirm = async () => {
    setLoading(true)
    const res = await fetch(`/api/orders/${order.id}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    const json = await res.json()
    if (!json.success) {
      toast({ title: json.error?.message || '구매확정에 실패했습니다', variant: 'destructive' })
      setLoading(false)
      return
    }
    toast({ title: '구매가 확정되었습니다' })
    setLoading(false)
    router.refresh()
  }

  // 수정 요청 (구매자)
  const handleRevision = async () => {
    if (!revisionNote.trim()) {
      toast({ title: '수정 요청 내용을 입력해주세요', variant: 'destructive' })
      return
    }
    setLoading(true)
    const res = await fetch(`/api/orders/${order.id}/revision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: revisionNote }),
    })
    const json = await res.json()
    if (!json.success) {
      toast({ title: json.error?.message || '수정 요청에 실패했습니다', variant: 'destructive' })
      setLoading(false)
      return
    }
    toast({ title: '수정 요청이 전달되었습니다' })
    setRevisionNote('')
    setLoading(false)
    router.refresh()
  }

  const canCancel =
    (isBuyer && ['PAID', 'ACCEPTED', 'IN_PROGRESS', 'REVISION_REQUESTED'].includes(order.status)) ||
    (isSeller && ['PAID', 'ACCEPTED', 'IN_PROGRESS'].includes(order.status))

  const hasAnyAction =
    canCancel ||
    (isSeller && ['PAID', 'ACCEPTED', 'IN_PROGRESS', 'REVISION_REQUESTED'].includes(order.status)) ||
    (isBuyer && order.status === 'DELIVERED') ||
    (isBuyer && order.status === 'COMPLETED' && !hasReview)

  if (!hasAnyAction) return null

  return (
    <>
      <Card>
        <CardHeader><CardTitle className="text-lg">주문 관리</CardTitle></CardHeader>
        <CardContent className="space-y-4">

          {/* 판매자: 수락/거절 (PAID) */}
          {isSeller && order.status === 'PAID' && (
            <div className="space-y-2">
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="메모를 남겨주세요 (선택사항)"
                rows={2}
              />
              <div className="flex gap-2">
                <Button onClick={() => updateStatus('ACCEPTED')} disabled={loading}>수락</Button>
                <Button variant="destructive" onClick={() => updateStatus('REJECTED')} disabled={loading}>거절</Button>
              </div>
            </div>
          )}

          {/* 판매자: 작업 시작 (ACCEPTED) */}
          {isSeller && order.status === 'ACCEPTED' && (
            <Button onClick={() => updateStatus('IN_PROGRESS')} disabled={loading}>작업 시작</Button>
          )}

          {/* 판매자: 납품하기 (IN_PROGRESS, REVISION_REQUESTED) */}
          {isSeller && ['IN_PROGRESS', 'REVISION_REQUESTED'].includes(order.status) && (
            <div className="space-y-2">
              <Label>납품 메시지</Label>
              <Textarea
                value={deliverNote}
                onChange={(e) => setDeliverNote(e.target.value)}
                placeholder="납품물에 대한 설명을 입력하세요"
                rows={3}
              />
              <Button onClick={handleDeliver} disabled={loading}>납품하기</Button>
            </div>
          )}

          {/* 구매자: 구매확정 / 수정요청 (DELIVERED) */}
          {isBuyer && order.status === 'DELIVERED' && (
            <div className="space-y-4">
              <div className="rounded-md border border-border p-3 text-sm text-muted-foreground">
                납품물을 확인하셨나요? 구매 확정 후에는 취소할 수 없습니다.
              </div>
              <Button onClick={handleConfirm} disabled={loading} className="w-full">구매 확정</Button>
              <div className="space-y-2">
                <Label>수정 요청 내용</Label>
                <Textarea
                  value={revisionNote}
                  onChange={(e) => setRevisionNote(e.target.value)}
                  placeholder="수정이 필요한 내용을 구체적으로 입력해주세요"
                  rows={3}
                />
                <Button variant="outline" onClick={handleRevision} disabled={loading} className="w-full">
                  수정 요청
                </Button>
              </div>
            </div>
          )}

          {/* 취소 버튼 */}
          {canCancel && (
            <div className="pt-2 border-t border-border">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setCancelModalOpen(true)}
                disabled={loading}
              >
                주문 취소
              </Button>
              {isBuyer && order.status === 'IN_PROGRESS' && (
                <p className="mt-1 text-xs text-muted-foreground">작업 진행 중 취소 시 50% 환불됩니다</p>
              )}
            </div>
          )}

          {/* 리뷰 작성 버튼 */}
          {isBuyer && order.status === 'COMPLETED' && !hasReview && (
            <Link href={`/orders/${order.id}/review`}>
              <Button className="w-full">리뷰 작성하기</Button>
            </Link>
          )}
        </CardContent>
      </Card>

      <CancelOrderModal
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleCancel}
        orderStatus={order.status}
        isBuyer={isBuyer}
        loading={loading}
      />
    </>
  )
}
