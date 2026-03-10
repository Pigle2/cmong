'use client'

import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { toast } from '@/hooks/use-toast'

interface FavoriteButtonProps {
  serviceId: string
}

export function FavoriteButton({ serviceId }: FavoriteButtonProps) {
  const { user } = useUser()
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    const check = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('service_id', serviceId)
        .single()
      setIsFavorite(!!data)
    }
    check()
  }, [user, serviceId])

  const handleToggle = async () => {
    if (!user) {
      toast({ title: '로그인이 필요합니다', variant: 'destructive' })
      return
    }
    setLoading(true)
    const prevFavorite = isFavorite
    setIsFavorite(!isFavorite)
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId }),
      })
      const body = await res.json()

      if (!res.ok || !body.success) {
        setIsFavorite(prevFavorite)
        toast({ title: body?.error?.message || '찜 처리에 실패했습니다', variant: 'destructive' })
        return
      }

      toast({ title: body.data.favorited ? '찜 목록에 추가했습니다' : '찜 목록에서 삭제했습니다' })
    } catch {
      setIsFavorite(prevFavorite)
      toast({ title: '찜 처리에 실패했습니다', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={loading}
      className="gap-1"
    >
      <Heart
        className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`}
      />
      찜
    </Button>
  )
}
