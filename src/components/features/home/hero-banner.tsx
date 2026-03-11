'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ServiceSearchBar } from '@/components/features/service/service-search-bar'

const BANNERS = [
  {
    id: 1,
    title: '전문가에게 맡기세요',
    subtitle: '디자인, 개발, 마케팅 등 비즈니스에 필요한 모든 전문 서비스',
    gradient: 'from-primary/5 via-primary/10 to-background',
  },
  {
    id: 2,
    title: '당신의 아이디어를 현실로',
    subtitle: '10,000명의 검증된 전문가가 함께합니다',
    gradient: 'from-blue-500/10 via-blue-400/5 to-background',
  },
  {
    id: 3,
    title: '합리적인 가격, 최고의 결과',
    subtitle: '프리랜서 직거래로 비용을 절약하세요',
    gradient: 'from-green-500/10 via-green-400/5 to-background',
  },
]

const SLIDE_INTERVAL = 5000

export function HeroBanner() {
  const [current, setCurrent] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % BANNERS.length)
    }, SLIDE_INTERVAL)
  }, [])

  useEffect(() => {
    startTimer()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [startTimer])

  const goTo = useCallback(
    (index: number) => {
      setCurrent(index)
      startTimer()
    },
    [startTimer],
  )

  const goPrev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + BANNERS.length) % BANNERS.length)
    startTimer()
  }, [startTimer])

  const goNext = useCallback(() => {
    setCurrent((prev) => (prev + 1) % BANNERS.length)
    startTimer()
  }, [startTimer])

  const banner = BANNERS[current]

  return (
    <section
      className={`relative bg-gradient-to-br ${banner.gradient} py-16 transition-all duration-700 md:py-24`}
    >
      {/* 좌우 화살표 */}
      <button
        onClick={goPrev}
        aria-label="이전 배너"
        className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/70 p-2 shadow hover:bg-background/90 transition-colors md:left-6"
      >
        <ChevronLeft className="h-5 w-5 text-foreground" />
      </button>
      <button
        onClick={goNext}
        aria-label="다음 배너"
        className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/70 p-2 shadow hover:bg-background/90 transition-colors md:right-6"
      >
        <ChevronRight className="h-5 w-5 text-foreground" />
      </button>

      {/* 콘텐츠 */}
      <div className="mx-auto max-w-7xl px-12 text-center md:px-16">
        <h1 className="mb-4 text-3xl font-bold transition-opacity duration-500 md:text-5xl">
          {banner.title}
        </h1>
        <p className="mb-8 text-lg text-muted-foreground transition-opacity duration-500">
          {banner.subtitle}
        </p>
        <div className="mx-auto max-w-xl">
          <ServiceSearchBar placeholder="어떤 서비스가 필요하세요?" />
        </div>
      </div>

      {/* 하단 인디케이터 */}
      <div className="mt-8 flex justify-center gap-2">
        {BANNERS.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`${i + 1}번 배너로 이동`}
            className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
              i === current
                ? 'bg-primary scale-125'
                : 'bg-muted-foreground/40 hover:bg-muted-foreground/70'
            }`}
          />
        ))}
      </div>
    </section>
  )
}
