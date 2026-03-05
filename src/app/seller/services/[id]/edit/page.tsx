'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'
import { PACKAGE_TIER_LABELS } from '@/lib/constants'

export default function EditServicePage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [service, setService] = useState<any>(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    tags: '',
    status: 'ACTIVE',
    packages: [
      { id: '', tier: 'STANDARD', name: '스탠다드', description: '', price: '', workDays: '', revisionCount: '' },
      { id: '', tier: 'DELUXE', name: '디럭스', description: '', price: '', workDays: '', revisionCount: '' },
      { id: '', tier: 'PREMIUM', name: '프리미엄', description: '', price: '', workDays: '', revisionCount: '' },
    ],
  })

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('services')
        .select('*, packages:service_packages(*), tags:service_tags(*)')
        .eq('id', params.id)
        .single()

      if (!data) return router.push('/seller/services')
      setService(data)
      setForm({
        title: data.title,
        description: data.description || '',
        tags: data.tags?.map((t: any) => t.tag).join(', ') || '',
        status: data.status,
        packages: ['STANDARD', 'DELUXE', 'PREMIUM'].map((tier) => {
          const pkg = data.packages?.find((p: any) => p.tier === tier)
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
    }
    load()
  }, [params.id])

  const handlePackageChange = (idx: number, field: string, value: string) => {
    setForm((f) => ({
      ...f,
      packages: f.packages.map((p, i) =>
        i === idx ? { ...p, [field]: value } : p
      ),
    }))
  }

  const handleSave = async () => {
    setLoading(true)

    await supabase
      .from('services')
      .update({
        title: form.title.trim(),
        description: form.description.trim(),
        status: form.status,
      })
      .eq('id', params.id)

    // Update packages
    for (const pkg of form.packages) {
      if (!pkg.price || !pkg.workDays) continue
      const data = {
        service_id: params.id as string,
        tier: pkg.tier,
        name: pkg.name,
        description: pkg.description,
        price: parseInt(pkg.price),
        work_days: parseInt(pkg.workDays),
        revision_count: parseInt(pkg.revisionCount) || 0,
      }
      if (pkg.id) {
        await supabase.from('service_packages').update(data).eq('id', pkg.id)
      } else {
        await supabase.from('service_packages').insert(data)
      }
    }

    // Update tags
    await supabase.from('service_tags').delete().eq('service_id', params.id)
    if (form.tags.trim()) {
      const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean)
      if (tags.length > 0) {
        await supabase.from('service_tags').insert(
          tags.map((tag) => ({ service_id: params.id as string, tag }))
        )
      }
    }

    toast({ title: '서비스가 수정되었습니다' })
    setLoading(false)
    router.push('/seller/services')
  }

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    await supabase.from('services').update({ status: 'DELETED' }).eq('id', params.id)
    toast({ title: '서비스가 삭제되었습니다' })
    router.push('/seller/services')
  }

  if (!service) return <div className="py-20 text-center">로딩 중...</div>

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
