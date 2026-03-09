'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ArrowLeftRight } from 'lucide-react'

export function ModeToggle() {
  const router = useRouter()
  const { mode, setMode } = useAuthStore()
  const [noSellerOpen, setNoSellerOpen] = useState(false)
  const supabase = createClient()

  const handleToggle = async () => {
    if (mode === 'BUYER') {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: sellerProfile, error } = await supabase
        .from('seller_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error || !sellerProfile) {
        setNoSellerOpen(true)
        return
      }

      setMode('SELLER')
      router.push('/seller/dashboard')
    } else {
      setMode('BUYER')
      router.push('/mypage')
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggle}
        className="gap-1.5 text-xs"
      >
        <ArrowLeftRight className="h-3.5 w-3.5" />
        {mode === 'BUYER' ? '판매자 모드' : '구매자 모드'}로 전환
      </Button>

      <Dialog open={noSellerOpen} onOpenChange={setNoSellerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>판매자 등록이 필요합니다</DialogTitle>
            <DialogDescription>
              판매자 모드를 이용하려면 먼저 판매자 프로필을 등록해야 합니다.
              지금 판매자 프로필을 등록하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoSellerOpen(false)}>
              취소
            </Button>
            <Button
              onClick={() => {
                setNoSellerOpen(false)
                router.push('/seller/profile')
              }}
            >
              판매자 등록하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
