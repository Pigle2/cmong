'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function SellerError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Seller layout error:', error)
  }, [error])

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4">
      <h2 className="text-xl font-semibold">문제가 발생했습니다</h2>
      <p className="text-sm text-muted-foreground">
        판매자 페이지를 불러오는 중 오류가 발생했습니다. 다시 시도해 주세요.
      </p>
      <div className="flex gap-2">
        <Button onClick={reset}>다시 시도</Button>
        <Button variant="outline" onClick={() => window.location.href = '/seller'}>
          판매자 홈으로
        </Button>
      </div>
    </div>
  )
}
