'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send } from 'lucide-react'

interface ChatInputProps {
  roomId: string
  currentUserId: string
  onMessageSent?: () => void
}

export function ChatInput({ roomId, onMessageSent }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || sending) return

    setSending(true)
    try {
      await fetch(`/api/chat/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message.trim() }),
      })
      setMessage('')
      onMessageSent?.()
    } catch (e) {
      console.error('send message error:', e)
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSend} className="flex items-center gap-2 border-t p-3">
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="메시지를 입력하세요..."
        className="flex-1"
      />
      <Button type="submit" size="icon" disabled={!message.trim() || sending}>
        <Send className="h-4 w-4" />
      </Button>
    </form>
  )
}
