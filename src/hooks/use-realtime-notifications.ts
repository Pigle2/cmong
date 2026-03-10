'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient, ensureRealtimeAuth } from '@/lib/supabase/client'
import type { Notification } from '@/types'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function useRealtimeNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const supabaseRef = useRef(createClient())

  const fetchNotifications = useCallback(async () => {
    if (!userId) return

    const supabase = supabaseRef.current
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    setNotifications(data || [])
    setUnreadCount(data?.filter((n) => !n.is_read).length || 0)
  }, [userId])

  useEffect(() => {
    fetchNotifications()

    if (!userId) return

    const supabase = supabaseRef.current
    let channel: RealtimeChannel | null = null
    let disposed = false

    const initRealtime = async () => {
      // Ensure auth token is set before subscribing
      await ensureRealtimeAuth(supabase)

      if (disposed) return

      channel = supabase
        .channel(`notifications:${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const newNotification = payload.new as Notification
            setNotifications((prev) => {
              // Prevent duplicates
              if (prev.some((n) => n.id === newNotification.id)) {
                return prev
              }
              return [newNotification, ...prev]
            })
            setUnreadCount((prev) => prev + 1)
          }
        )
        .subscribe()
    }

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
      if (channel) supabase.removeChannel(channel)
      authSubscription.unsubscribe()
    }
  }, [userId, fetchNotifications])

  const markAllRead = async () => {
    if (!userId) return
    try {
      const res = await fetch('/api/notifications/read-all', { method: 'POST' })
      if (!res.ok) {
        console.error('markAllRead error:', res.status)
        return
      }
    } catch (err) {
      console.error('markAllRead fetch error:', err)
      return
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  return { notifications, unreadCount, markAllRead, refresh: fetchNotifications }
}
