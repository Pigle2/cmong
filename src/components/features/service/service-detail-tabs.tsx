'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { PackageComparison } from '@/components/features/service/package-comparison'
import { ReviewList } from '@/components/features/review/review-list'
import Image from 'next/image'

interface ServiceDetailTabsProps {
  description: string
  packages: any[]
  serviceId: string
  reviews: any[]
  reviewCount: number
  avgRating: number
  images: any[]
}

export function ServiceDetailTabs({
  description,
  packages,
  serviceId,
  reviews,
  reviewCount,
  avgRating,
  images,
}: ServiceDetailTabsProps) {
  return (
    <Tabs defaultValue="intro">
      <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto">
        <TabsTrigger
          value="intro"
          className="rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
        >
          서비스 소개
        </TabsTrigger>
        <TabsTrigger
          value="portfolio"
          className="rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
        >
          포트폴리오
        </TabsTrigger>
        <TabsTrigger
          value="reviews"
          className="rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
        >
          리뷰 ({reviewCount})
        </TabsTrigger>
        <TabsTrigger
          value="faq"
          className="rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
        >
          FAQ
        </TabsTrigger>
      </TabsList>

      <TabsContent value="intro" className="mt-6">
        <div className="prose max-w-none">
          <h2 className="text-xl font-bold">서비스 설명</h2>
          <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">
            {description || '서비스 설명이 없습니다.'}
          </div>
        </div>

        <Separator className="my-8" />

        <div>
          <h2 className="mb-4 text-xl font-bold">패키지 비교</h2>
          <PackageComparison packages={packages} serviceId={serviceId} />
        </div>
      </TabsContent>

      <TabsContent value="portfolio" className="mt-6">
        {images.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            등록된 포트폴리오가 없습니다.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.map((img: any) => (
              <div
                key={img.id}
                className="relative aspect-square overflow-hidden rounded-lg bg-muted"
              >
                <Image
                  src={img.image_url}
                  alt="포트폴리오 이미지"
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, 33vw"
                />
              </div>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="reviews" className="mt-6">
        <ReviewList reviews={reviews} avgRating={avgRating} />
      </TabsContent>

      <TabsContent value="faq" className="mt-6">
        <p className="py-12 text-center text-sm text-muted-foreground">
          등록된 FAQ가 없습니다.
        </p>
      </TabsContent>
    </Tabs>
  )
}
