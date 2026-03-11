'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ChevronDown, Palette, Code, Video, Megaphone, Languages, FileText, Briefcase, Hammer, GraduationCap, Scale } from 'lucide-react'
import type { Category } from '@/types/database'

const CATEGORY_ICON_MAP: Record<string, React.ReactNode> = {
  Palette: <Palette className="h-4 w-4" />,
  Code: <Code className="h-4 w-4" />,
  Video: <Video className="h-4 w-4" />,
  Megaphone: <Megaphone className="h-4 w-4" />,
  Languages: <Languages className="h-4 w-4" />,
  FileText: <FileText className="h-4 w-4" />,
  Briefcase: <Briefcase className="h-4 w-4" />,
  Hammer: <Hammer className="h-4 w-4" />,
  GraduationCap: <GraduationCap className="h-4 w-4" />,
  Scale: <Scale className="h-4 w-4" />,
}

export function CategoryDropdown() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open || categories.length > 0) return

    setLoading(true)
    fetch('/api/categories')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setCategories(json.data)
        }
      })
      .catch(() => {
        // 조회 실패 시 빈 목록 유지
      })
      .finally(() => {
        setLoading(false)
      })
  }, [open, categories.length])

  function handleSelect(slug: string) {
    setOpen(false)
    router.push(`/services?category=${slug}`)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          카테고리
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        {loading ? (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            불러오는 중...
          </div>
        ) : categories.length === 0 ? (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            카테고리가 없습니다
          </div>
        ) : (
          categories.map((cat) => (
            <DropdownMenuItem
              key={cat.id}
              onClick={() => handleSelect(cat.slug)}
              className="flex cursor-pointer items-center gap-2"
            >
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                {CATEGORY_ICON_MAP[cat.icon ?? ''] ?? <Briefcase className="h-4 w-4" />}
              </span>
              <span>{cat.name}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
