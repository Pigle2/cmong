export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PackageComparison } from '@/components/features/service/package-comparison'
import { FavoriteButton } from '@/components/features/service/favorite-button'
import { ReviewList } from '@/components/features/review/review-list'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Star, MessageSquare, Clock, CheckCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { SELLER_GRADES } from '@/lib/constants'
import { ImageGallery } from '@/components/features/service/image-gallery'

interface Props {
  params: { id: string }
}

export default async function ServiceDetailPage({ params }: Props) {
  const supabase = await createClient()

  const { data: service } = await supabase
    .from('services')
    .select(`
      *,
      packages:service_packages(*),
      images:service_images(*),
      tags:service_tags(*),
      seller:profiles!seller_id(
        id, nickname, avatar_url, bio, created_at
      ),
      category:categories!category_id(id, name, slug, parent_id)
    `)
    .eq('id', params.id)
    .single()

  if (!service || service.status === 'DELETED') notFound()

  // Get seller profile
  const { data: sellerProfile } = await supabase
    .from('seller_profiles')
    .select('*')
    .eq('user_id', service.seller_id)
    .single()

  // Get reviews
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, reviewer:profiles!reviewer_id(nickname, avatar_url)')
    .eq('service_id', service.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Get parent category
  let parentCategory = null
  if (service.category?.parent_id) {
    const { data } = await supabase
      .from('categories')
      .select('name, slug')
      .eq('id', service.category.parent_id)
      .single()
    parentCategory = data
  }

  const sortedPackages = service.packages?.sort((a: any, b: any) => {
    const order = { STANDARD: 0, DELUXE: 1, PREMIUM: 2 }
    return (order[a.tier as keyof typeof order] || 0) - (order[b.tier as keyof typeof order] || 0)
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">홈</Link>
        <span>/</span>
        {parentCategory && (
          <>
            <Link href={`/services?category=${parentCategory.slug}`} className="hover:text-foreground">
              {parentCategory.name}
            </Link>
            <span>/</span>
          </>
        )}
        {service.category && (
          <Link href={`/services?category=${service.category.slug}`} className="hover:text-foreground">
            {service.category.name}
          </Link>
        )}
      </nav>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <h1 className="mb-4 text-2xl font-bold">{service.title}</h1>

          <div className="mb-4 flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{Number(service.avg_rating).toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">({service.review_count})</span>
            </div>
            <span className="text-sm text-muted-foreground">주문 {service.order_count}건</span>
            <FavoriteButton serviceId={service.id} />
          </div>

          {/* Tags */}
          {service.tags && service.tags.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {service.tags.map((tag: any) => (
                <Badge key={tag.id} variant="secondary">{tag.tag}</Badge>
              ))}
            </div>
          )}

          {/* Image Gallery */}
          <ImageGallery
            thumbnailUrl={service.thumbnail_url}
            images={(service.images || []) as Array<{ id: string; image_url: string; sort_order: number }>}
            alt={service.title}
          />

          {/* Description */}
          <div className="prose max-w-none">
            <h2 className="text-xl font-bold">서비스 설명</h2>
            <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">
              {service.description || '서비스 설명이 없습니다.'}
            </div>
          </div>

          <Separator className="my-8" />

          {/* Package Comparison */}
          <div>
            <h2 className="mb-4 text-xl font-bold">패키지 비교</h2>
            <PackageComparison packages={sortedPackages || []} serviceId={service.id} />
          </div>

          <Separator className="my-8" />

          {/* Reviews */}
          <div>
            <h2 className="mb-4 text-xl font-bold">
              리뷰 ({service.review_count})
            </h2>
            <ReviewList reviews={reviews || []} avgRating={Number(service.avg_rating)} />
          </div>
        </div>

        {/* Sidebar - Seller Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            <div className="rounded-lg border p-6">
              <div className="mb-4 flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={service.seller?.avatar_url || undefined} />
                  <AvatarFallback>{service.seller?.nickname?.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{service.seller?.nickname}</h3>
                  {sellerProfile && (
                    <Badge variant="secondary" className="text-xs">
                      {SELLER_GRADES[sellerProfile.grade as keyof typeof SELLER_GRADES]}
                    </Badge>
                  )}
                </div>
              </div>

              {service.seller?.bio && (
                <p className="mb-4 text-sm text-muted-foreground">{service.seller.bio}</p>
              )}

              <div className="mb-4 grid grid-cols-2 gap-4 text-center text-sm">
                <div>
                  <div className="flex items-center justify-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">
                      {sellerProfile ? Number(sellerProfile.avg_rating).toFixed(1) : '0.0'}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">평점</span>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                    <span className="font-medium">{sellerProfile?.total_sales || 0}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">완료</span>
                </div>
              </div>

              {sellerProfile?.response_time && (
                <div className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  평균 응답 {sellerProfile.response_time}분
                </div>
              )}

              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                활동 시작: {formatDate(service.seller?.created_at || '')}
              </div>

              <Separator className="my-4" />

              <Link href={`/chat?seller=${service.seller_id}&service=${service.id}`}>
                <Button variant="outline" className="w-full gap-2">
                  <MessageSquare className="h-4 w-4" />
                  문의하기
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
