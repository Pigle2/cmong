'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { Camera, X, Plus, Briefcase, Image, ShieldCheck } from 'lucide-react'

export default function SellerProfileClient() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [introduction, setIntroduction] = useState('')
  const [specialties, setSpecialties] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('seller_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      if (data) {
        setDisplayName(data.display_name ?? '')
        setIntroduction(data.introduction ?? '')
        setSpecialties(Array.isArray(data.specialties) ? data.specialties : [])
      }
    }
    load()
  }, [])

  const addTag = () => {
    const trimmed = tagInput.trim()
    if (!trimmed) return
    if (specialties.includes(trimmed)) {
      toast({ title: '이미 추가된 태그입니다', variant: 'destructive' })
      return
    }
    setSpecialties((prev) => [...prev, trimmed])
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    setSpecialties((prev) => prev.filter((t) => t !== tag))
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast({ title: '활동명을 입력해주세요', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/seller/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: displayName.trim(),
          introduction: introduction.trim() || null,
          specialties,
        }),
      })
      const body = await res.json()
      if (!res.ok || !body.success) {
        toast({ title: body?.error?.message || '저장에 실패했습니다', variant: 'destructive' })
      } else {
        toast({ title: '판매자 프로필이 저장되었습니다' })
      }
    } catch {
      toast({ title: '저장에 실패했습니다', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">판매자 프로필</h1>

      {/* 프로필 이미지 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">프로필 이미지</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted">
            <Camera className="h-8 w-8 text-muted-foreground" />
          </div>
          <Button variant="outline" size="sm" disabled>
            이미지 변경
          </Button>
          <p className="text-xs text-muted-foreground">
            프로토타입: 이미지 업로드는 추후 지원 예정
          </p>
        </CardContent>
      </Card>

      {/* 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="displayName">닉네임 / 활동명</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="표시될 이름"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="introduction">소개</Label>
            <Textarea
              id="introduction"
              value={introduction}
              onChange={(e) => setIntroduction(e.target.value)}
              placeholder="전문가로서의 경력과 강점을 소개해주세요"
              rows={5}
            />
          </div>

          <div className="space-y-1.5">
            <Label>전문 분야 태그</Label>
            <div className="flex flex-wrap gap-2 min-h-[2.25rem] rounded-md border bg-background px-3 py-2">
              {specialties.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                    aria-label={`${tag} 태그 제거`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {specialties.length === 0 && (
                <span className="text-sm text-muted-foreground">태그를 추가해주세요</span>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="웹디자인, 로고, 브랜딩 등"
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={addTag} className="shrink-0">
                <Plus className="mr-1 h-4 w-4" />
                추가
              </Button>
            </div>
          </div>

          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? '저장 중...' : '저장'}
          </Button>
        </CardContent>
      </Card>

      {/* 경력 사항 (프로토타입) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Briefcase className="h-5 w-5" />
            경력 사항
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            경력 정보 입력 기능은 추후 지원 예정입니다.
          </p>
          <Button variant="outline" size="sm" disabled>
            <Plus className="mr-1 h-4 w-4" />
            경력 추가
          </Button>
          <p className="text-xs text-muted-foreground">프로토타입: 추후 구현 예정</p>
        </CardContent>
      </Card>

      {/* 포트폴리오 (프로토타입) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Image className="h-5 w-5" />
            포트폴리오
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex aspect-square items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/30 bg-muted/30"
              >
                <Plus className="h-6 w-6 text-muted-foreground/50" />
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            포트폴리오 업로드 기능은 추후 지원 예정입니다.
          </p>
          <p className="text-xs text-muted-foreground">프로토타입: 추후 구현 예정</p>
        </CardContent>
      </Card>

      {/* 인증 정보 (프로토타입) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5" />
            인증 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center gap-3 rounded-md border bg-muted/30 px-4 py-3">
              <div className="h-4 w-4 rounded border border-muted-foreground/40 bg-background" />
              <span className="text-sm text-muted-foreground">본인 인증: 미인증</span>
            </div>
            <div className="flex items-center gap-3 rounded-md border bg-muted/30 px-4 py-3">
              <div className="h-4 w-4 rounded border border-muted-foreground/40 bg-background" />
              <span className="text-sm text-muted-foreground">사업자 인증: 미인증</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">프로토타입: 추후 구현 예정</p>
        </CardContent>
      </Card>
    </div>
  )
}
