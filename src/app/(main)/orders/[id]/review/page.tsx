'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StarRating } from '@/components/features/review/star-rating'
import { toast } from '@/hooks/use-toast'

export default function ReviewPage() {
  const router = useRouter()
  const params = useParams()

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [ratings, setRatings] = useState({
    overall: 5,
    quality: 5,
    communication: 5,
    delivery: 5,
  })
  const [content, setContent] = useState('')

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/orders/${params.id}/review-data`)
      const json = await res.json()

      if (res.status === 401) {
        router.push('/login')
        return
      }

      if (!res.ok) {
        const code = json.error?.code
        if (code === 'DUPLICATE') {
          toast({ title: json.error?.message || '이미 리뷰를 작성하셨습니다' })
          router.push('/orders')
        } else {
          // BAD_REQUEST(미완료), FORBIDDEN, NOT_FOUND 등 — 주문 상세로 이동
          router.push(`/orders/${params.id}`)
        }
        return
      }

      setOrder(json.data)
    }
    load()
  }, [params.id])

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({ title: '리뷰 내용을 입력해주세요', variant: 'destructive' })
      return
    }

    if (!order) return

    setLoading(true)

    // 리뷰 작성은 API Route를 통해 처리 — 서버에서 주문 소유권/상태 검증
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: order.id,
        rating: ratings.overall,
        qualityRating: ratings.quality,
        communicationRating: ratings.communication,
        deliveryRating: ratings.delivery,
        content: content.trim(),
      }),
    })

    const json = await res.json()

    if (!res.ok || !json.success) {
      const message = json.error?.message || '리뷰 등록에 실패했습니다'
      toast({ title: message, variant: 'destructive' })
      setLoading(false)
      return
    }

    toast({ title: '리뷰가 등록되었습니다' })
    router.push(`/orders/${order.id}`)
  }

  if (!order) {
    return <div className="py-20 text-center text-muted-foreground">로딩 중...</div>
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">리뷰 작성</h1>

      <Card className="mb-4">
        <CardContent className="p-4">
          <p className="font-medium">{order.service?.title}</p>
          <p className="text-sm text-muted-foreground">주문번호: {order.order_number}</p>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">평점</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>종합 평점</Label>
              <StarRating value={ratings.overall} onChange={(v) => setRatings((r) => ({ ...r, overall: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label>작업 품질</Label>
              <StarRating value={ratings.quality} onChange={(v) => setRatings((r) => ({ ...r, quality: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label>소통</Label>
              <StarRating value={ratings.communication} onChange={(v) => setRatings((r) => ({ ...r, communication: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label>납기 준수</Label>
              <StarRating value={ratings.delivery} onChange={(v) => setRatings((r) => ({ ...r, delivery: v }))} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">리뷰 내용</CardTitle></CardHeader>
          <CardContent>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="서비스 이용 경험을 상세히 적어주세요. 다른 구매자에게 도움이 됩니다."
              rows={5}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.back()}>취소</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? '등록 중...' : '리뷰 등록'}
          </Button>
        </div>
      </div>
    </div>
  )
}
