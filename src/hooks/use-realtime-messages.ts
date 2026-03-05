'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ChatMessage } from '@/types'

export function useRealtimeMessages(roomId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const lastCountRef = useRef(0)

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/messages`)
      const body = await res.json()
      if (body.success) {
        setMessages(body.data)
        lastCountRef.current = body.data.length
      }
    } catch (e) {
      console.error('fetch messages error:', e)
    } finally {
      setLoading(false)
    }
  }, [roomId])

  useEffect(() => {
    fetchMessages()

    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null

    // Set auth token explicitly for Realtime RLS
    const initRealtime = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          supabase.realtime.setAuth(session.access_token)
        }
      } catch {
        // Continue even if getSession fails
      }

      channel = supabase
        .channel(`messages:${roomId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `room_id=eq.${roomId}`,
          },
          () => {
            fetchMessages()
          }
        )
        .subscribe()
    }

    initRealtime()

    // Polling fallback every 3s for reliability
    const pollInterval = setInterval(fetchMessages, 3000)

    return () => {
      clearInterval(pollInterval)
      if (channel) supabase.removeChannel(channel)
    }
  }, [roomId, fetchMessages])

  return { messages, loading, refetch: fetchMessages }
}
