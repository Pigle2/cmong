'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Star, Eye, ShoppingCart, Edit, Copy, Pause, Play, Trash2, Plus } from 'lucide-react'
import { SERVICE_STATUS } from '@/lib/constants'
import { formatPrice } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

type ServicePackage = {
  id: string
  tier: string
  price: number
}

type Category = {
  name: string
}

type Service = {
  id: string
  title: string
  status: string
  thumbnail_url: string | null
  avg_rating: number
  view_count: number
  order_count: number
  packages: ServicePackage[] | null
  category: Category | null
}

type Props = {
  services: Service[]
}

const STATUS_BADGE_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  ACTIVE: 'default',
  DRAFT: 'secondary',
  PAUSED: 'outline',
}

function getMinPrice(packages: ServicePackage[] | null): number | null {
  if (!packages || packages.length === 0) return null
  const min = packages.reduce((acc, pkg) => (pkg.price < acc ? pkg.price : acc), Infinity)
  return min === Infinity ? null : min
}

function ServiceCard({ service, onAction }: { service: Service; onAction: () => void }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState<string | null>(null)

  const minPrice = getMinPrice(service.packages)

  async function handleStatusChange(newStatus: 'ACTIVE' | 'PAUSED') {
    setLoading(newStatus)
    try {
      const res = await fetch(`/api/seller/services/${service.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast({
          title: '상태 변경 실패',
          description: data.error?.message ?? '알 수 없는 오류가 발생했습니다',
          variant: 'destructive',
        })
        return
      }
      const label = newStatus === 'PAUSED' ? '중지' : '재개'
      toast({ title: `서비스가 ${label}되었습니다` })
      onAction()
    } catch {
      toast({ title: '상태 변경 실패', description: '네트워크 오류가 발생했습니다', variant: 'destructive' })
    } finally {
      setLoading(null)
    }
  }

  async function handleDelete() {
    if (!window.confirm('서비스를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return
    setLoading('DELETE')
    try {
      const res = await fetch(`/api/seller/services/${service.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok || !data.success) {
        toast({
          title: '삭제 실패',
          description: data.error?.message ?? '알 수 없는 오류가 발생했습니다',
          variant: 'destructive',
        })
        return
      }
      toast({ title: '서비스가 삭제되었습니다' })
      onAction()
    } catch {
      toast({ title: '삭제 실패', description: '네트워크 오류가 발생했습니다', variant: 'destructive' })
    } finally {
      setLoading(null)
    }
  }

  function handleCopy() {
    router.push(`/seller/services/new?copy=${service.id}`)
  }

  const isLoading = loading !== null

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
          {service.thumbnail_url ? (
            <img src={service.thumbnail_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-2xl text-muted-foreground">
              <ShoppingCart className="h-8 w-8 opacity-30" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <Badge variant={STATUS_BADGE_VARIANT[service.status] ?? 'secondary'} className="text-xs">
              {SERVICE_STATUS[service.status as keyof typeof SERVICE_STATUS] ?? service.status}
            </Badge>
            {service.category && (
              <span className="text-xs text-muted-foreground">{service.category.name}</span>
            )}
          </div>
          <h3 className="mb-2 truncate font-medium">{service.title}</h3>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5" />
              {Number(service.avg_rating).toFixed(1)}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {service.view_count}
            </span>
            <span className="flex items-center gap-1">
              <ShoppingCart className="h-3.5 w-3.5" />
              {service.order_count}건
            </span>
            <span className="font-medium text-foreground">
              {minPrice !== null ? formatPrice(minPrice) : '-'}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link href={`/seller/services/${service.id}/edit`}>
            <Button variant="outline" size="sm" className="gap-1" disabled={isLoading}>
              <Edit className="h-3.5 w-3.5" />
              수정
            </Button>
          </Link>

          {service.status === 'ACTIVE' && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={handleCopy}
                disabled={isLoading}
              >
                <Copy className="h-3.5 w-3.5" />
                복제
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => handleStatusChange('PAUSED')}
                disabled={isLoading}
              >
                <Pause className="h-3.5 w-3.5" />
                {loading === 'PAUSED' ? '처리중...' : '중지'}
              </Button>
            </>
          )}

          {service.status === 'PAUSED' && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => handleStatusChange('ACTIVE')}
              disabled={isLoading}
            >
              <Play className="h-3.5 w-3.5" />
              {loading === 'ACTIVE' ? '처리중...' : '재개'}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            className="gap-1 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={handleDelete}
            disabled={isLoading}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {loading === 'DELETE' ? '삭제중...' : '삭제'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function SellerServicesClient({ services }: Props) {
  const router = useRouter()

  const counts = {
    all: services.length,
    ACTIVE: services.filter((s) => s.status === 'ACTIVE').length,
    DRAFT: services.filter((s) => s.status === 'DRAFT').length,
    PAUSED: services.filter((s) => s.status === 'PAUSED').length,
  }

  function handleAction() {
    router.refresh()
  }

  function renderList(list: Service[]) {
    if (list.length === 0) {
      return (
        <div className="py-16 text-center text-muted-foreground">
          해당 상태의 서비스가 없습니다
        </div>
      )
    }
    return (
      <div className="space-y-4">
        {list.map((service) => (
          <ServiceCard key={service.id} service={service} onAction={handleAction} />
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">서비스 관리</h1>
        <Link href="/seller/services/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            새 서비스 등록
          </Button>
        </Link>
      </div>

      {services.length === 0 ? (
        <div className="py-20 text-center">
          <p className="mb-4 text-muted-foreground">등록된 서비스가 없습니다</p>
          <Link href="/seller/services/new">
            <Button>첫 서비스 등록하기</Button>
          </Link>
        </div>
      ) : (
        <Tabs defaultValue="all">
          <TabsList className="mb-6">
            <TabsTrigger value="all">전체 ({counts.all})</TabsTrigger>
            <TabsTrigger value="ACTIVE">판매중 ({counts.ACTIVE})</TabsTrigger>
            <TabsTrigger value="DRAFT">임시저장 ({counts.DRAFT})</TabsTrigger>
            <TabsTrigger value="PAUSED">중지 ({counts.PAUSED})</TabsTrigger>
          </TabsList>

          <TabsContent value="all">{renderList(services)}</TabsContent>
          <TabsContent value="ACTIVE">{renderList(services.filter((s) => s.status === 'ACTIVE'))}</TabsContent>
          <TabsContent value="DRAFT">{renderList(services.filter((s) => s.status === 'DRAFT'))}</TabsContent>
          <TabsContent value="PAUSED">{renderList(services.filter((s) => s.status === 'PAUSED'))}</TabsContent>
        </Tabs>
      )}
    </div>
  )
}
