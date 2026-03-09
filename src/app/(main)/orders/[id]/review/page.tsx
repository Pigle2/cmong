'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StarRating } from '@/components/features/review/star-rating'
import { toast } from '@/hooks/use-toast'

export default function ReviewPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

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
      const { data } = await supabase
        .from('orders')
        .select('*, service:services(title)')
        .eq('id', params.id)
        .single()
      if (data?.status !== 'COMPLETED') {
        router.push(`/orders/${params.id}`)
        return
      }

      // 기존 리뷰 존재 여부 확인
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('order_id', params.id)
        .single()
      if (existingReview) {
        toast({ title: '이미 리뷰를 작성하셨습니다' })
        router.push('/orders')
        return
      }

      setOrder(data)
    }
    load()
  }, [params.id])

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({ title: '리뷰 내용을 입력해주세요', variant: 'destructive' })
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !order) return

    setLoading(true)

    const { error } = await supabase.from('reviews').insert({
      order_id: order.id,
      service_id: order.service_id,
      reviewer_id: user.id,
      seller_id: order.seller_id,
      rating: ratings.overall,
      quality_rating: ratings.quality,
      communication_rating: ratings.communication,
      delivery_rating: ratings.delivery,
      content: content.trim(),
    })

    if (error) {
      toast({ title: '리뷰 등록에 실패했습니다', variant: 'destructive' })
      setLoading(false)
      return
    }

    // Notify seller
    await supabase.from('notifications').insert({
      user_id: order.seller_id,
      type: 'REVIEW',
      title: '새 리뷰',
      message: `${order.service?.title}에 새로운 리뷰가 등록되었습니다`,
      link: `/services/${order.service_id}`,
    })

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
