'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'
import { PACKAGE_TIER_LABELS } from '@/lib/constants'

interface CategoryOption {
  id: number
  name: string
  slug: string
  depth: number
  parent_id: number | null
}

const TIERS = ['STANDARD', 'DELUXE', 'PREMIUM'] as const

export default function NewServiceClient() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [subcategories, setSubcategories] = useState<CategoryOption[]>([])
  const [leafCategories, setLeafCategories] = useState<CategoryOption[]>([])

  const [form, setForm] = useState({
    categoryId: '',
    subCategoryId: '',
    leafCategoryId: '',
    title: '',
    description: '',
    tags: '',
    packages: TIERS.map((tier) => ({
      tier,
      name: PACKAGE_TIER_LABELS[tier],
      description: '',
      price: '',
      workDays: '',
      revisionCount: '',
    })),
  })

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('depth', 0)
        .order('sort_order')
      setCategories(data || [])
    }
    load()
  }, [])

  const handleCategoryChange = async (val: string) => {
    setForm((f) => ({ ...f, categoryId: val, subCategoryId: '', leafCategoryId: '' }))
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('parent_id', parseInt(val))
      .order('sort_order')
    setSubcategories(data || [])
    setLeafCategories([])
  }

  const handleSubCategoryChange = async (val: string) => {
    setForm((f) => ({ ...f, subCategoryId: val, leafCategoryId: '' }))
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('parent_id', parseInt(val))
      .order('sort_order')
    setLeafCategories(data || [])
  }

  const handlePackageChange = (idx: number, field: string, value: string) => {
    setForm((f) => ({
      ...f,
      packages: f.packages.map((p, i) =>
        i === idx ? { ...p, [field]: value } : p
      ),
    }))
  }

  const handleSubmit = async (status: 'DRAFT' | 'ACTIVE') => {
    const categoryId = form.leafCategoryId || form.subCategoryId || form.categoryId
    if (!categoryId || !form.title.trim()) {
      toast({ title: '카테고리와 제목은 필수입니다', variant: 'destructive' })
      return
    }

    // 클라이언트 사전 검증
    for (const pkg of form.packages) {
      const hasPrice = pkg.price !== ''
      const hasWorkDays = pkg.workDays !== ''
      if (hasPrice && !hasWorkDays) {
        toast({ title: `${PACKAGE_TIER_LABELS[pkg.tier]}: 가격을 입력하면 작업일도 입력해야 합니다`, variant: 'destructive' })
        return
      }
      if (!hasPrice && hasWorkDays) {
        toast({ title: `${PACKAGE_TIER_LABELS[pkg.tier]}: 작업일을 입력하면 가격도 입력해야 합니다`, variant: 'destructive' })
        return
      }
      if (hasPrice && parseInt(pkg.price) <= 0) {
        toast({ title: `${PACKAGE_TIER_LABELS[pkg.tier]}: 가격은 1 이상이어야 합니다`, variant: 'destructive' })
        return
      }
      if (hasWorkDays && parseInt(pkg.workDays) <= 0) {
        toast({ title: `${PACKAGE_TIER_LABELS[pkg.tier]}: 작업일은 1 이상이어야 합니다`, variant: 'destructive' })
        return
      }
    }

    setLoading(true)
    try {
      const validPackages = form.packages
        .filter((p) => p.price && p.workDays)
        .map((p) => ({
          tier: p.tier,
          name: p.name || PACKAGE_TIER_LABELS[p.tier],
          description: p.description,
          price: parseInt(p.price),
          workDays: parseInt(p.workDays),
          revisionCount: parseInt(p.revisionCount) || 0,
        }))

      const tags = form.tags.trim()
        ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : []

      const res = await fetch('/api/seller/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: parseInt(categoryId),
          title: form.title.trim(),
          description: form.description.trim(),
          status,
          packages: validPackages.length > 0 ? validPackages : undefined,
          tags: tags.length > 0 ? tags : undefined,
        }),
      })

      const body = await res.json()
      if (!res.ok || !body.success) {
        toast({ title: body?.error?.message || '서비스 등록에 실패했습니다', variant: 'destructive' })
        return
      }

      toast({ title: status === 'ACTIVE' ? '서비스가 등록되었습니다' : '임시저장되었습니다' })
      router.push('/seller/services')
    } catch {
      toast({ title: '서비스 등록에 실패했습니다', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold">새 서비스 등록</h1>

      <div className="space-y-6">
        {/* Category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">카테고리</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>대분류</Label>
                <Select value={form.categoryId} onValueChange={handleCategoryChange}>
                  <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {subcategories.length > 0 && (
                <div>
                  <Label>중분류</Label>
                  <Select value={form.subCategoryId} onValueChange={handleSubCategoryChange}>
                    <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                    <SelectContent>
                      {subcategories.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {leafCategories.length > 0 && (
                <div>
                  <Label>소분류</Label>
                  <Select
                    value={form.leafCategoryId}
                    onValueChange={(v) => setForm((f) => ({ ...f, leafCategoryId: v }))}
                  >
                    <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                    <SelectContent>
                      {leafCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>서비스 제목</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="서비스 제목을 입력하세요"
                maxLength={100}
              />
            </div>
            <div>
              <Label>서비스 설명</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="서비스에 대해 상세히 설명해주세요"
                rows={8}
              />
            </div>
            <div>
              <Label>태그 (쉼표로 구분)</Label>
              <Input
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                placeholder="로고, 디자인, 브랜딩"
              />
            </div>
          </CardContent>
        </Card>

        {/* Packages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">패키지 설정</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {form.packages.map((pkg, idx) => (
                <div key={pkg.tier} className="rounded-lg border p-4">
                  <h4 className="mb-3 font-medium">{PACKAGE_TIER_LABELS[pkg.tier]}</h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>패키지 이름</Label>
                      <Input
                        value={pkg.name}
                        onChange={(e) => handlePackageChange(idx, 'name', e.target.value)}
                        placeholder="패키지 이름"
                      />
                    </div>
                    <div>
                      <Label>가격 (원)</Label>
                      <Input
                        type="number"
                        min="1"
                        value={pkg.price}
                        onChange={(e) => handlePackageChange(idx, 'price', e.target.value)}
                        placeholder="50000"
                      />
                    </div>
                    <div>
                      <Label>작업일 (일)</Label>
                      <Input
                        type="number"
                        min="1"
                        value={pkg.workDays}
                        onChange={(e) => handlePackageChange(idx, 'workDays', e.target.value)}
                        placeholder="5"
                      />
                    </div>
                    <div>
                      <Label>수정 횟수</Label>
                      <Input
                        type="number"
                        value={pkg.revisionCount}
                        onChange={(e) => handlePackageChange(idx, 'revisionCount', e.target.value)}
                        placeholder="2"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>설명</Label>
                      <Textarea
                        value={pkg.description}
                        onChange={(e) => handlePackageChange(idx, 'description', e.target.value)}
                        placeholder="패키지에 포함된 항목을 설명하세요"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => handleSubmit('DRAFT')} disabled={loading}>
            임시저장
          </Button>
          <Button onClick={() => handleSubmit('ACTIVE')} disabled={loading}>
            {loading ? '등록 중...' : '서비스 등록'}
          </Button>
        </div>
      </div>
    </div>
  )
}
