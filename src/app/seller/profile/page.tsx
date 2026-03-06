'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'

export default function SellerProfilePage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    displayName: '',
    introduction: '',
    specialties: '',
  })

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
      if (!user) return
      const { data } = await supabase
        .from('seller_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      if (data) {
        setForm({
          displayName: data.display_name,
          introduction: data.introduction || '',
          specialties: data.specialties?.join(', ') || '',
        })
      }
    }
    load()
  }, [])

  const handleSave = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) return

    setLoading(true)
    const specialties = form.specialties.split(',').map((s) => s.trim()).filter(Boolean)

    const { data: existing } = await supabase
      .from('seller_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existing) {
      const { error } = await supabase
        .from('seller_profiles')
        .update({
          display_name: form.displayName.trim(),
          introduction: form.introduction.trim() || null,
          specialties,
        })
        .eq('user_id', user.id)
      if (error) {
        toast({ title: '저장에 실패했습니다', variant: 'destructive' })
        setLoading(false)
        return
      }
    } else {
      const { error } = await supabase.from('seller_profiles').insert({
        user_id: user.id,
        display_name: form.displayName.trim(),
        introduction: form.introduction.trim() || null,
        specialties,
      })
      if (error) {
        toast({ title: '저장에 실패했습니다', variant: 'destructive' })
        setLoading(false)
        return
      }
    }

    toast({ title: '판매자 프로필이 저장되었습니다' })
    setLoading(false)
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">판매자 프로필</h1>

      <Card>
        <CardHeader><CardTitle className="text-lg">프로필 정보</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>활동명</Label>
            <Input
              value={form.displayName}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              placeholder="표시될 이름"
            />
          </div>
          <div>
            <Label>소개</Label>
            <Textarea
              value={form.introduction}
              onChange={(e) => setForm((f) => ({ ...f, introduction: e.target.value }))}
              placeholder="전문가로서의 경력과 강점을 소개해주세요"
              rows={5}
            />
          </div>
          <div>
            <Label>전문 분야 (쉼표로 구분)</Label>
            <Input
              value={form.specialties}
              onChange={(e) => setForm((f) => ({ ...f, specialties: e.target.value }))}
              placeholder="웹디자인, 로고, 브랜딩"
            />
          </div>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? '저장 중...' : '저장'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
