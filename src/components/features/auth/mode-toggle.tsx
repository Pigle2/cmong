'use client'

import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { ArrowLeftRight } from 'lucide-react'

export function ModeToggle() {
  const { mode, toggleMode } = useAuthStore()

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleMode}
      className="gap-1.5 text-xs"
    >
      <ArrowLeftRight className="h-3.5 w-3.5" />
      {mode === 'BUYER' ? '판매자 모드' : '구매자 모드'}로 전환
    </Button>
  )
}
