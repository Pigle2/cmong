'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface CancelOrderModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (reason: string) => Promise<void>
  orderStatus: string
  isBuyer: boolean
  loading: boolean
}

function getRefundMessage(status: string, isBuyer: boolean): string {
  if (!isBuyer) return '전액 환불됩니다.'
  if (['PAID', 'ACCEPTED'].includes(status)) return '전액 환불됩니다.'
  if (['IN_PROGRESS', 'REVISION_REQUESTED'].includes(status)) return '작업이 진행 중이므로 50% 환불됩니다.'
  return ''
}

export function CancelOrderModal({ open, onClose, onConfirm, orderStatus, isBuyer, loading }: CancelOrderModalProps) {
  const [reason, setReason] = useState('')
  const refundMessage = getRefundMessage(orderStatus, isBuyer)

  const handleConfirm = async () => {
    await onConfirm(reason)
    setReason('')
  }

  const handleClose = () => {
    setReason('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>주문 취소</DialogTitle>
          <DialogDescription>
            주문을 취소하시겠습니까? {refundMessage}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="cancel-reason">취소 사유 *</Label>
          <Textarea
            id="cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="취소 사유를 입력해주세요 (5자 이상)"
            rows={4}
          />
          <p className="text-xs text-muted-foreground">{reason.trim().length} / 최소 5자</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            돌아가기
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading || reason.trim().length < 5}
          >
            {loading ? '처리중...' : '취소 확인'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
