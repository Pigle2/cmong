'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { LayoutGrid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ViewToggle() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentView = searchParams.get('view') || 'grid'

  function handleViewChange(view: 'grid' | 'list') {
    const params = new URLSearchParams(searchParams.toString())
    params.set('view', view)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 ${currentView === 'grid' ? 'text-foreground' : 'text-muted-foreground'}`}
        onClick={() => handleViewChange('grid')}
        aria-label="그리드 뷰"
        aria-pressed={currentView === 'grid'}
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 ${currentView === 'list' ? 'text-foreground' : 'text-muted-foreground'}`}
        onClick={() => handleViewChange('list')}
        aria-label="리스트 뷰"
        aria-pressed={currentView === 'list'}
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  )
}
