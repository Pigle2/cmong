'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient, ensureRealtimeAuth } from '@/lib/supabase/client'
import type { ChatMessage } from '@/types'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function useRealtimeMessages(roomId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [realtimeConnected, setRealtimeConnected] = useState(false)
  const supabaseRef = useRef(createClient())

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/messages`)
      const body = await res.json()
      if (!res.ok || !body.success) {
        setError(body?.error?.message || '메시지를 불러올 수 없습니다')
        return
      }
      setMessages(body.data)
      setError(null)
    } catch (e) {
      console.error('fetch messages error:', e)
      setError('메시지를 불러올 수 없습니다')
    } finally {
      setLoading(false)
    }
  }, [roomId])

  useEffect(() => {
    const supabase = supabaseRef.current
    let channel: RealtimeChannel | null = null
    let pollInterval: ReturnType<typeof setInterval> | null = null
    let disposed = false

    // Initial fetch
    fetchMessages()

    const initRealtime = async () => {
      // Ensure auth token is set before subscribing
      await ensureRealtimeAuth(supabase)

      if (disposed) return

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
          (payload) => {
            const newMessage = payload.new as ChatMessage
            setMessages((prev) => {
              // Prevent duplicate messages (e.g. from own send + realtime)
              if (prev.some((m) => m.id === newMessage.id)) {
                return prev
              }
              return [...prev, newMessage]
            })
          }
        )
        .subscribe((status) => {
          if (disposed) return
          if (status === 'SUBSCRIBED') {
            setRealtimeConnected(true)
            // Realtime is working: clear fast polling, use slow fallback only
            if (pollInterval) {
              clearInterval(pollInterval)
              pollInterval = null
            }
            // Slow fallback poll (60s) for edge cases (missed events, reconnect gaps)
            pollInterval = setInterval(fetchMessages, 60_000)
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setRealtimeConnected(false)
            // Realtime failed: fall back to faster polling
            if (pollInterval) {
              clearInterval(pollInterval)
            }
            pollInterval = setInterval(fetchMessages, 5_000)
          }
        })
    }

    // Start with a moderate poll until realtime connects
    pollInterval = setInterval(fetchMessages, 10_000)

    initRealtime()

    // Listen for auth state changes to update Realtime auth token
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (
          (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') &&
          session?.access_token
        ) {
          await supabase.realtime.setAuth(session.access_token)
        }
      }
    )

    return () => {
      disposed = true
      if (pollInterval) clearInterval(pollInterval)
      if (channel) supabase.removeChannel(channel)
      authSubscription.unsubscribe()
    }
  }, [roomId, fetchMessages])

  return { messages, loading, error, realtimeConnected, refetch: fetchMessages }
}
