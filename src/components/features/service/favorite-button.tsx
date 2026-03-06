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
  const supabase = createClient()

  useEffect(() => {
    if (!user) return
    const check = async () => {
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
    if (isFavorite) {
      setIsFavorite(false)
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('service_id', serviceId)
      if (error) {
        setIsFavorite(prevFavorite)
        toast({ title: '찜 삭제에 실패했습니다', variant: 'destructive' })
        setLoading(false)
        return
      }
      toast({ title: '찜 목록에서 삭제했습니다' })
    } else {
      setIsFavorite(true)
      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, service_id: serviceId })
      if (error) {
        setIsFavorite(prevFavorite)
        toast({ title: '찜 추가에 실패했습니다', variant: 'destructive' })
        setLoading(false)
        return
      }
      toast({ title: '찜 목록에 추가했습니다' })
    }
    setLoading(false)
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
