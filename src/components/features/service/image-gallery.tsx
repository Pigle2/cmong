'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageGalleryProps {
  thumbnailUrl: string | null
  images: Array<{ id: string; image_url: string; sort_order: number }>
  alt: string
}

export function ImageGallery({ thumbnailUrl, images, alt }: ImageGalleryProps) {
  const sortedImages = [...images].sort((a, b) => a.sort_order - b.sort_order)

  const allImages: string[] = [
    ...(thumbnailUrl ? [thumbnailUrl] : []),
    ...sortedImages.map((img) => img.image_url),
  ]

  const [currentIndex, setCurrentIndex] = useState(0)

  if (allImages.length === 0) {
    return (
      <div className="mb-8 aspect-video overflow-hidden rounded-lg bg-muted">
        <div className="flex h-full items-center justify-center text-6xl">🎨</div>
      </div>
    )
  }

  const showControls = allImages.length > 1

  const prev = () => setCurrentIndex((i) => (i - 1 + allImages.length) % allImages.length)
  const next = () => setCurrentIndex((i) => (i + 1) % allImages.length)

  return (
    <div className="mb-8 select-none">
      {/* 메인 이미지 */}
      <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
        <img
          src={allImages[currentIndex]}
          alt={`${alt} ${currentIndex + 1}`}
          className="h-full w-full object-cover"
        />

        {showControls && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white transition hover:bg-black/60"
              aria-label="이전 이미지"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white transition hover:bg-black/60"
              aria-label="다음 이미지"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* 인덱스 표시 */}
            <div className="absolute bottom-2 right-3 rounded-full bg-black/40 px-2 py-0.5 text-xs text-white">
              {currentIndex + 1} / {allImages.length}
            </div>
          </>
        )}
      </div>

      {/* 썸네일 인디케이터 */}
      {showControls && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {allImages.map((src, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                'h-16 w-24 flex-shrink-0 overflow-hidden rounded-md border-2 transition',
                idx === currentIndex
                  ? 'border-primary opacity-100'
                  : 'border-transparent opacity-60 hover:opacity-90'
              )}
              aria-label={`이미지 ${idx + 1} 보기`}
            >
              <img
                src={src}
                alt={`${alt} 썸네일 ${idx + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
