'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nickname: '',
    bio: '',
  })

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (profile) {
        setForm({ nickname: profile.nickname, bio: profile.bio || '' })
      }
    }
    load()
  }, [])

  const handleSave = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) return

    setLoading(true)
    await supabase
      .from('profiles')
      .update({
        nickname: form.nickname.trim(),
        bio: form.bio.trim() || null,
      })
      .eq('id', user.id)

    toast({ title: '프로필이 수정되었습니다' })
    setLoading(false)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">설정</h1>

      <Card>
        <CardHeader><CardTitle className="text-lg">프로필 수정</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>닉네임</Label>
            <Input
              value={form.nickname}
              onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))}
            />
          </div>
          <div>
            <Label>소개</Label>
            <Textarea
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              placeholder="자기소개를 입력하세요"
              rows={3}
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
