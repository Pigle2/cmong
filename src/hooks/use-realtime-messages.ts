'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ChatMessage } from '@/types'

export function useRealtimeMessages(roomId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*, sender:profiles!sender_id(id, nickname, avatar_url)')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })

    setMessages(data || [])
    setLoading(false)
  }, [roomId])

  useEffect(() => {
    fetchMessages()

    const channel = supabase
      .channel(`messages:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const { data: message } = await supabase
            .from('chat_messages')
            .select('*, sender:profiles!sender_id(id, nickname, avatar_url)')
            .eq('id', payload.new.id)
            .single()

          if (message) {
            setMessages((prev) => [...prev, message])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, fetchMessages])

  return { messages, loading, refetch: fetchMessages }
}
