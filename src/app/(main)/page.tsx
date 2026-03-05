export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ServiceCard } from '@/components/features/service/service-card'
import { Button } from '@/components/ui/button'
import {
  Palette, Code, Video, Megaphone, Languages,
  FileText, Briefcase, Hammer, GraduationCap, Scale, Search,
} from 'lucide-react'

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Palette: <Palette className="h-6 w-6" />,
  Code: <Code className="h-6 w-6" />,
  Video: <Video className="h-6 w-6" />,
  Megaphone: <Megaphone className="h-6 w-6" />,
  Languages: <Languages className="h-6 w-6" />,
  FileText: <FileText className="h-6 w-6" />,
  Briefcase: <Briefcase className="h-6 w-6" />,
  Hammer: <Hammer className="h-6 w-6" />,
  GraduationCap: <GraduationCap className="h-6 w-6" />,
  Scale: <Scale className="h-6 w-6" />,
}

export default async function HomePage() {
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('depth', 0)
    .order('sort_order')

  const { data: popularServices } = await supabase
    .from('services')
    .select('*, packages:service_packages(*), seller:profiles!seller_id(nickname, avatar_url)')
    .eq('status', 'ACTIVE')
    .order('order_count', { ascending: false })
    .limit(8)

  const { data: newServices } = await supabase
    .from('services')
    .select('*, packages:service_packages(*), seller:profiles!seller_id(nickname, avatar_url)')
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false })
    .limit(8)

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/5 via-primary/10 to-background py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h1 className="mb-4 text-3xl font-bold md:text-5xl">
            전문가에게 맡기세요
          </h1>
          <p className="mb-8 text-lg text-muted-foreground">
            디자인, 개발, 마케팅 등 비즈니스에 필요한 모든 전문 서비스
          </p>
          <div className="mx-auto flex max-w-xl items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Link href="/services" className="block">
                <div className="h-12 w-full rounded-lg border bg-background pl-10 pr-4 flex items-center text-muted-foreground">
                  어떤 서비스가 필요하세요?
                </div>
              </Link>
            </div>
            <Link href="/services">
              <Button size="lg" className="h-12">
                검색
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-8 text-center text-2xl font-bold">카테고리</h2>
          <div className="grid grid-cols-5 gap-4 md:grid-cols-10">
            {categories?.map((cat) => (
              <Link
                key={cat.id}
                href={`/services?category=${cat.slug}`}
                className="flex flex-col items-center gap-2 rounded-lg p-3 text-center transition-colors hover:bg-muted"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {CATEGORY_ICONS[cat.icon || ''] || <Briefcase className="h-6 w-6" />}
                </div>
                <span className="text-xs font-medium">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Services */}
      {popularServices && popularServices.length > 0 && (
        <section className="py-12 bg-muted/30">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">인기 서비스</h2>
              <Link href="/services?sort=orders" className="text-sm text-primary hover:underline">
                더보기
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {popularServices.map((service: any) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* New Services */}
      {newServices && newServices.length > 0 && (
        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">신규 서비스</h2>
              <Link href="/services?sort=newest" className="text-sm text-primary hover:underline">
                더보기
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {newServices.map((service: any) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-primary py-16 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold">전문가로 활동하세요</h2>
          <p className="mb-8 text-primary-foreground/80">
            당신의 전문성으로 수입을 창출하세요
          </p>
          <Link href="/register">
            <Button variant="secondary" size="lg">
              전문가 등록하기
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
