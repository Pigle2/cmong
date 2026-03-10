'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'
import { PACKAGE_TIER_LABELS } from '@/lib/constants'

interface ServiceData {
  id: string
  title: string
  description: string | null
  status: string
  packages: Array<{
    id: string
    tier: string
    name: string
    description: string | null
    price: number
    work_days: number
    revision_count: number
  }>
  tags: Array<{ tag: string }>
}

export default function EditServiceClient({ service }: { service: ServiceData }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    title: service.title,
    description: service.description || '',
    tags: service.tags?.map((t) => t.tag).join(', ') || '',
    status: service.status,
    packages: (['STANDARD', 'DELUXE', 'PREMIUM'] as const).map((tier) => {
      const pkg = service.packages?.find((p) => p.tier === tier)
      return {
        id: pkg?.id || '',
        tier,
        name: pkg?.name || PACKAGE_TIER_LABELS[tier],
        description: pkg?.description || '',
        price: pkg?.price?.toString() || '',
        workDays: pkg?.work_days?.toString() || '',
        revisionCount: pkg?.revision_count?.toString() || '',
      }
    }),
  })

  const handlePackageChange = (idx: number, field: string, value: string) => {
    setForm((f) => ({
      ...f,
      packages: f.packages.map((p, i) =>
        i === idx ? { ...p, [field]: value } : p
      ),
    }))
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: '제목은 필수입니다', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      const packages = form.packages
        .filter((pkg) => pkg.price && pkg.workDays)
        .map((pkg) => ({
          id: pkg.id || undefined,
          tier: pkg.tier,
          name: pkg.name,
          description: pkg.description,
          price: parseInt(pkg.price),
          workDays: parseInt(pkg.workDays),
          revisionCount: parseInt(pkg.revisionCount) || 0,
        }))

      const tags = form.tags.trim()
        ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : []

      const res = await fetch(`/api/seller/services/${service.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          packages,
          tags,
        }),
      })
      const body = await res.json()

      if (!res.ok || !body.success) {
        toast({ title: body?.error?.message || '서비스 수정에 실패했습니다', variant: 'destructive' })
        return
      }

      toast({ title: '서비스가 수정되었습니다' })
      router.push('/seller/services')
    } catch {
      toast({ title: '서비스 수정에 실패했습니다', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    try {
      const res = await fetch(`/api/seller/services/${service.id}`, { method: 'DELETE' })
      const body = await res.json()
      if (!res.ok || !body.success) {
        toast({ title: body?.error?.message || '서비스 삭제에 실패했습니다', variant: 'destructive' })
        return
      }
      toast({ title: '서비스가 삭제되었습니다' })
      router.push('/seller/services')
    } catch {
      toast({ title: '서비스 삭제에 실패했습니다', variant: 'destructive' })
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold">서비스 수정</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">기본 정보</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>서비스 제목</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div>
              <Label>서비스 설명</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={8}
              />
            </div>
            <div>
              <Label>태그 (쉼표로 구분)</Label>
              <Input
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">패키지 설정</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            {form.packages.map((pkg, idx) => (
              <div key={pkg.tier} className="rounded-lg border p-4">
                <h4 className="mb-3 font-medium">{PACKAGE_TIER_LABELS[pkg.tier]}</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><Label>패키지 이름</Label>
                    <Input value={pkg.name} onChange={(e) => handlePackageChange(idx, 'name', e.target.value)} /></div>
                  <div><Label>가격 (원)</Label>
                    <Input type="number" value={pkg.price} onChange={(e) => handlePackageChange(idx, 'price', e.target.value)} /></div>
                  <div><Label>작업일</Label>
                    <Input type="number" value={pkg.workDays} onChange={(e) => handlePackageChange(idx, 'workDays', e.target.value)} /></div>
                  <div><Label>수정 횟수</Label>
                    <Input type="number" value={pkg.revisionCount} onChange={(e) => handlePackageChange(idx, 'revisionCount', e.target.value)} /></div>
                  <div className="sm:col-span-2"><Label>설명</Label>
                    <Textarea value={pkg.description} onChange={(e) => handlePackageChange(idx, 'description', e.target.value)} rows={2} /></div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="destructive" onClick={handleDelete}>삭제</Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.back()}>취소</Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? '저장 중...' : '저장'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
