import { Suspense } from 'react'
import NewOrderClient from './client'

export default function NewOrderPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-muted-foreground">로딩 중...</div>}>
      <NewOrderClient />
    </Suspense>
  )
}
