'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'

const BUDGET_OPTIONS = [
  { value: '50000', label: '50,000원' },
  { value: '100000', label: '100,000원' },
  { value: '200000', label: '200,000원' },
  { value: '300000', label: '300,000원' },
  { value: '500000', label: '500,000원' },
  { value: '1000000', label: '1,000,000원' },
]

interface Category {
  id: number
  name: string
  depth: number
}

export default function QuotePage() {
  const router = useRouter()

  const [categories, setCategories] = useState<Category[]>([])
  const [categoryId, setCategoryId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [budgetMin, setBudgetMin] = useState('')
  const [budgetMax, setBudgetMax] = useState('')
  const [deadline, setDeadline] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch('/api/categories')
        if (!res.ok) return
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          setCategories(json.data.filter((c: Category) => c.depth === 0))
        }
      } catch {
        // 카테고리 로드 실패 시 빈 목록 유지
      }
    }
    loadCategories()
  }, [])

  const validate = (): string | null => {
    if (!categoryId) return '카테고리를 선택해주세요.'
    if (title.trim().length < 10) return '제목은 10자 이상 입력해주세요.'
    if (title.trim().length > 100) return '제목은 100자 이하로 입력해주세요.'
    if (description.trim().length < 50) return '상세 내용은 50자 이상 입력해주세요.'
    if (description.trim().length > 2000) return '상세 내용은 2000자 이하로 입력해주세요.'
    if (budgetMin && budgetMax && Number(budgetMin) > Number(budgetMax)) {
      return '최소 예산이 최대 예산보다 클 수 없습니다.'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const error = validate()
    if (error) {
      toast({ title: error, variant: 'destructive' })
      return
    }

    setSubmitting(true)
    // 프로토타입: 실제 견적 매칭 미구현, 토스트 후 메인 이동
    await new Promise((resolve) => setTimeout(resolve, 300))
    toast({ title: '견적 요청이 등록되었습니다' })
    router.push('/')
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">견적 요청</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">요청 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* 카테고리 */}
            <div className="space-y-1.5">
              <Label htmlFor="category">
                카테고리 <span className="text-destructive">*</span>
              </Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="카테고리를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 제목 */}
            <div className="space-y-1.5">
              <Label htmlFor="title">
                제목 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="요청하실 작업 제목을 입력하세요 (10~100자)"
                maxLength={100}
              />
              <p className="text-right text-xs text-muted-foreground">
                {title.length} / 100
              </p>
            </div>

            {/* 상세 내용 */}
            <div className="space-y-1.5">
              <Label htmlFor="description">
                상세 내용 <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="원하시는 작업 내용, 참고자료, 요구사항 등을 상세히 설명해주세요. (50~2000자)"
                rows={7}
                maxLength={2000}
              />
              <p
                className={`text-right text-xs ${
                  description.length < 50
                    ? 'text-muted-foreground'
                    : 'text-foreground'
                }`}
              >
                {description.length} / 2000
                {description.length < 50 && description.length > 0 && (
                  <span className="ml-1 text-destructive">
                    (최소 {50 - description.length}자 더 필요)
                  </span>
                )}
              </p>
            </div>

            {/* 예산 범위 */}
            <div className="space-y-1.5">
              <Label>예산 범위</Label>
              <div className="flex items-center gap-3">
                <Select value={budgetMin} onValueChange={setBudgetMin}>
                  <SelectTrigger>
                    <SelectValue placeholder="최소 금액" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUDGET_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="shrink-0 text-sm text-muted-foreground">~</span>
                <Select value={budgetMax} onValueChange={setBudgetMax}>
                  <SelectTrigger>
                    <SelectValue placeholder="최대 금액" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUDGET_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 희망 납기 */}
            <div className="space-y-1.5">
              <Label htmlFor="deadline">희망 납기</Label>
              <Input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                min={today}
              />
            </div>
          </CardContent>
        </Card>

        <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
          프로토타입 버전: 실제 견적 매칭은 이루어지지 않습니다.
        </div>

        <Button type="submit" disabled={submitting} className="w-full" size="lg">
          {submitting ? '등록 중...' : '견적 요청하기'}
        </Button>
      </form>
    </div>
  )
}
