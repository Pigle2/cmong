import { Suspense } from 'react'
import ChatPageClient from './client'

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex h-[calc(100vh-4rem)] items-center justify-center text-muted-foreground">로딩 중...</div>}>
      <ChatPageClient />
    </Suspense>
  )
}
