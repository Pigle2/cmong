'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/hooks/use-toast'
import { formatPrice } from '@/lib/utils'
import { PACKAGE_TIER_LABELS } from '@/lib/constants'

export default function NewOrderClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const serviceId = searchParams.get('service')
  const packageId = searchParams.get('package')

  const [service, setService] = useState<any>(null)
  const [pkg, setPkg] = useState<any>(null)
  const [requirements, setRequirements] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!serviceId) return
      const { data } = await supabase
        .from('services')
        .select('*, packages:service_packages(*), seller:profiles!seller_id(nickname)')
        .eq('id', serviceId)
        .single()
      if (data) {
        setService(data)
        if (packageId) {
          const p = data.packages?.find((p: any) => p.id === packageId)
          setPkg(p)
        }
      }
    }
    load()
  }, [serviceId, packageId])

  const handleOrder = async () => {
    if (!service || !pkg) return

    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) { router.push('/login'); return }

    if (user.id === service.seller_id) {
      toast({ title: '본인의 서비스는 주문할 수 없습니다', variant: 'destructive' })
      return
    }

    setLoading(true)

    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + pkg.work_days)

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        buyer_id: user.id,
        seller_id: service.seller_id,
        service_id: service.id,
        package_id: pkg.id,
        status: 'PAID',
        requirements: requirements.trim() || null,
        total_amount: pkg.price,
        due_date: dueDate.toISOString(),
      })
      .select()
      .single()

    if (error || !order) {
      toast({ title: '주문에 실패했습니다', variant: 'destructive' })
      setLoading(false)
      return
    }

    await supabase.from('order_status_history').insert({
      order_id: order.id, from_status: null, to_status: 'PAID',
      changed_by: user.id, note: '주문이 생성되었습니다',
    })

    await supabase.from('notifications').insert({
      user_id: service.seller_id, type: 'ORDER',
      title: '새 주문', message: `새로운 주문이 접수되었습니다: ${service.title}`,
      link: `/orders/${order.id}`,
    })

    toast({ title: '주문이 완료되었습니다' })
    router.push(`/orders/${order.id}`)
  }

  if (!service || !pkg) {
    return <div className="mx-auto max-w-2xl px-4 py-20 text-center text-muted-foreground">서비스 정보를 불러오는 중...</div>
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">주문하기</h1>
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">서비스 정보</CardTitle></CardHeader>
          <CardContent>
            <h3 className="font-medium">{service.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">판매자: {service.seller?.nickname}</p>
            <Separator className="my-3" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">패키지</span><span>{PACKAGE_TIER_LABELS[pkg.tier]} - {pkg.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">작업일</span><span>{pkg.work_days}일</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">수정 횟수</span><span>{pkg.revision_count}회</span></div>
              <Separator />
              <div className="flex justify-between font-medium text-lg"><span>총 결제금액</span><span className="text-primary">{formatPrice(pkg.price)}</span></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">요구사항</CardTitle></CardHeader>
          <CardContent>
            <Label htmlFor="requirements">작업 요구사항을 상세히 적어주세요</Label>
            <Textarea id="requirements" value={requirements} onChange={(e) => setRequirements(e.target.value)}
              placeholder="원하시는 작업 내용, 참고자료, 스타일 등을 상세히 설명해주세요." rows={6} className="mt-2" />
          </CardContent>
        </Card>
        <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
          프로토타입 버전: 실제 결제는 이루어지지 않으며, 주문 상태만 관리됩니다.
        </div>
        <Button onClick={handleOrder} disabled={loading} className="w-full" size="lg">
          {loading ? '주문 처리 중...' : `${formatPrice(pkg.price)} 주문하기`}
        </Button>
      </div>
    </div>
  )
}
