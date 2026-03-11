'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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

  const serviceId = searchParams.get('service')
  const packageId = searchParams.get('package')

  const [service, setService] = useState<any>(null)
  const [pkg, setPkg] = useState<any>(null)
  const [requirements, setRequirements] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!serviceId) return
      const res = await fetch(`/api/services/${serviceId}`)
      if (!res.ok) {
        toast({ title: '서비스를 찾을 수 없습니다', variant: 'destructive' })
        router.push('/')
        return
      }
      const json = await res.json()
      if (json.success && json.data) {
        setService(json.data)
        if (packageId) {
          const p = json.data.packages?.find((p: any) => p.id === packageId)
          setPkg(p)
        }
      }
    }
    load()
  }, [serviceId, packageId])

  const handleOrder = async () => {
    if (!service || !pkg) return

    setLoading(true)

    // 주문 생성은 API Route를 통해 처리 — 서버에서 price/seller_id 검증 및 인증 확인
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId: service.id,
        packageId: pkg.id,
        requirements: requirements.trim() || null,
      }),
    })

    if (res.status === 401) {
      router.push('/login')
      return
    }

    const json = await res.json()

    if (!res.ok || !json.success) {
      const message = json.error?.message || '주문에 실패했습니다'
      toast({ title: message, variant: 'destructive' })
      setLoading(false)
      return
    }

    router.push(`/orders/${json.data.id}/complete`)
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
