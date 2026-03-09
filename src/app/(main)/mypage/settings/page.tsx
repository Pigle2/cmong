'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'

const WITHDRAWAL_REASONS = [
  '서비스를 더 이상 이용하지 않음',
  '개인 정보 보호 우려',
  '더 나은 대안 서비스 발견',
  '불편하거나 사용하기 어려움',
  '원하는 서비스/전문가가 없음',
  '기타',
]

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nickname: '',
    bio: '',
  })

  // 비밀번호 변경
  const [pwForm, setPwForm] = useState({
    current: '',
    next: '',
    confirm: '',
  })
  const [pwLoading, setPwLoading] = useState(false)

  // 회원 탈퇴
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [withdrawReason, setWithdrawReason] = useState('')
  const [withdrawLoading, setWithdrawLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast({ title: '로그인이 필요합니다', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          nickname: form.nickname.trim(),
          bio: form.bio.trim() || null,
        })
        .eq('id', user.id)

      if (error) {
        toast({ title: '프로필 수정에 실패했습니다', variant: 'destructive' })
      } else {
        toast({ title: '프로필이 수정되었습니다' })
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    if (!pwForm.current) {
      toast({ title: '현재 비밀번호를 입력해주세요', variant: 'destructive' })
      return
    }
    if (pwForm.next.length < 8) {
      toast({ title: '새 비밀번호는 8자 이상이어야 합니다', variant: 'destructive' })
      return
    }
    if (pwForm.next !== pwForm.confirm) {
      toast({ title: '새 비밀번호가 일치하지 않습니다', variant: 'destructive' })
      return
    }

    setPwLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) return

      // 현재 비밀번호 검증
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: pwForm.current,
      })
      if (signInError) {
        toast({ title: '현재 비밀번호가 올바르지 않습니다', variant: 'destructive' })
        return
      }

      const { error } = await supabase.auth.updateUser({ password: pwForm.next })
      if (error) {
        toast({ title: '비밀번호 변경에 실패했습니다', variant: 'destructive' })
      } else {
        toast({ title: '비밀번호가 변경되었습니다' })
        setPwForm({ current: '', next: '', confirm: '' })
      }
    } finally {
      setPwLoading(false)
    }
  }

  const handleWithdraw = async () => {
    if (!withdrawReason) {
      toast({ title: '탈퇴 사유를 선택해주세요', variant: 'destructive' })
      return
    }

    setWithdrawLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 진행 중인 주문 확인 (BR-MY-03)
      const { data: activeOrders } = await supabase
        .from('orders')
        .select('id')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .in('status', ['PAID', 'ACCEPTED', 'IN_PROGRESS', 'DELIVERED', 'REVISION_REQUESTED'])

      if (activeOrders && activeOrders.length > 0) {
        toast({
          title: '탈퇴 불가',
          description: '진행 중인 거래가 있어 탈퇴할 수 없습니다. 모든 거래 완료 후 탈퇴해 주세요.',
          variant: 'destructive',
        })
        setWithdrawOpen(false)
        return
      }

      // API를 통해 계정 삭제 (서버 사이드에서 admin 권한으로 처리)
      const res = await fetch('/api/auth/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: withdrawReason }),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        toast({
          title: '회원 탈퇴에 실패했습니다',
          description: json.error || '잠시 후 다시 시도해주세요',
          variant: 'destructive',
        })
        return
      }

      toast({ title: '회원 탈퇴가 완료되었습니다' })
      window.location.href = '/'
    } finally {
      setWithdrawLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">설정</h1>

      {/* 프로필 수정 */}
      <Card className="mb-6">
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

      {/* 비밀번호 변경 */}
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-lg">비밀번호 변경</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>현재 비밀번호</Label>
            <Input
              type="password"
              value={pwForm.current}
              onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))}
              placeholder="현재 비밀번호"
            />
          </div>
          <div>
            <Label>새 비밀번호</Label>
            <Input
              type="password"
              value={pwForm.next}
              onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))}
              placeholder="8자 이상"
            />
          </div>
          <div>
            <Label>새 비밀번호 확인</Label>
            <Input
              type="password"
              value={pwForm.confirm}
              onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
              placeholder="새 비밀번호를 다시 입력하세요"
            />
          </div>
          <Button onClick={handlePasswordChange} disabled={pwLoading}>
            {pwLoading ? '변경 중...' : '비밀번호 변경'}
          </Button>
        </CardContent>
      </Card>

      {/* 회원 탈퇴 */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-lg text-destructive">회원 탈퇴</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            탈퇴 시 모든 데이터는 90일 후 완전히 삭제됩니다. 진행 중인 거래가 있으면 탈퇴할 수 없습니다.
          </p>
          <Button variant="destructive" onClick={() => setWithdrawOpen(true)}>
            회원 탈퇴
          </Button>
        </CardContent>
      </Card>

      {/* 탈퇴 확인 모달 */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>정말 탈퇴하시겠습니까?</DialogTitle>
            <DialogDescription>
              탈퇴 후 30일 이내 재가입이 불가하며, 모든 데이터는 90일 후 완전히 삭제됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label className="mb-2 block">탈퇴 사유</Label>
            <Select value={withdrawReason} onValueChange={setWithdrawReason}>
              <SelectTrigger>
                <SelectValue placeholder="탈퇴 사유를 선택해주세요" />
              </SelectTrigger>
              <SelectContent>
                {WITHDRAWAL_REASONS.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawOpen(false)} disabled={withdrawLoading}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleWithdraw} disabled={withdrawLoading}>
              {withdrawLoading ? '처리 중...' : '탈퇴하기'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
