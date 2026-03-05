'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send } from 'lucide-react'

interface ChatInputProps {
  roomId: string
  currentUserId: string
}

export function ChatInput({ roomId, currentUserId }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const supabase = createClient()

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || sending) return

    setSending(true)
    await supabase.from('chat_messages').insert({
      room_id: roomId,
      sender_id: currentUserId,
      message_type: 'TEXT',
      content: message.trim(),
    })

    // Update room timestamp
    await supabase
      .from('chat_rooms')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', roomId)

    setMessage('')
    setSending(false)
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
