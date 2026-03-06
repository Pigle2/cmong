import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      realtime: {
        params: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
      },
    }
  )
}

/**
 * Ensures that the Supabase Realtime connection has a valid auth token.
 * Must be called before subscribing to channels that require RLS.
 *
 * The @supabase/supabase-js client sets auth on SIGNED_IN / TOKEN_REFRESHED
 * events, but NOT on INITIAL_SESSION. When a page loads with an existing
 * session (from cookies), the Realtime client may attempt to connect before
 * the auth token is available, causing WebSocket authentication failures.
 *
 * This helper resolves the race condition by explicitly waiting for the
 * session and calling setAuth before any channel subscription.
 */
export async function ensureRealtimeAuth(
  supabase: ReturnType<typeof createClient>
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    await supabase.realtime.setAuth(session.access_token)
  }
}
