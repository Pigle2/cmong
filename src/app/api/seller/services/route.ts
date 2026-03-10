import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const VALID_TIERS = ['STANDARD', 'DELUXE', 'PREMIUM']
const MAX_TAGS = 20
const MAX_TAG_LENGTH = 50
const MAX_PRICE = 100_000_000
const MAX_WORK_DAYS = 365

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' } },
      { status: 401 }
    )
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: '잘못된 요청입니다' } },
      { status: 400 }
    )
  }

  const { categoryId, title, description, status, packages, tags } = body

  // 입력값 검증
  if (!categoryId || typeof categoryId !== 'number') {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: '카테고리를 선택해주세요' } },
      { status: 400 }
    )
  }

  if (!title || typeof title !== 'string' || title.trim().length === 0 || title.length > 100) {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: '제목은 1~100자여야 합니다' } },
      { status: 400 }
    )
  }

  if (description && (typeof description !== 'string' || description.length > 10000)) {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: '설명은 최대 10000자입니다' } },
      { status: 400 }
    )
  }

  if (status && !['DRAFT', 'ACTIVE'].includes(status)) {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: '허용되지 않은 상태값입니다' } },
      { status: 400 }
    )
  }

  // 카테고리 존재 확인
  const { data: category } = await supabase
    .from('categories')
    .select('id')
    .eq('id', categoryId)
    .single()

  if (!category) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: '카테고리를 찾을 수 없습니다' } },
      { status: 404 }
    )
  }

  // 패키지 검증
  if (packages && Array.isArray(packages)) {
    for (const pkg of packages) {
      if (!VALID_TIERS.includes(pkg.tier)) {
        return NextResponse.json(
          { success: false, error: { code: 'BAD_REQUEST', message: '잘못된 패키지 등급입니다' } },
          { status: 400 }
        )
      }
      if (typeof pkg.price !== 'number' || pkg.price <= 0 || pkg.price > MAX_PRICE) {
        return NextResponse.json(
          { success: false, error: { code: 'BAD_REQUEST', message: `패키지 가격은 1~${MAX_PRICE.toLocaleString()}원이어야 합니다` } },
          { status: 400 }
        )
      }
      if (typeof pkg.workDays !== 'number' || pkg.workDays <= 0 || pkg.workDays > MAX_WORK_DAYS) {
        return NextResponse.json(
          { success: false, error: { code: 'BAD_REQUEST', message: `작업일은 1~${MAX_WORK_DAYS}일이어야 합니다` } },
          { status: 400 }
        )
      }
    }
  }

  // 태그 검증
  if (tags && Array.isArray(tags)) {
    if (tags.length > MAX_TAGS) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: `태그는 최대 ${MAX_TAGS}개까지 가능합니다` } },
        { status: 400 }
      )
    }
    if (tags.some((t: unknown) => typeof t === 'string' && t.trim().length > MAX_TAG_LENGTH)) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: `태그는 최대 ${MAX_TAG_LENGTH}자입니다` } },
        { status: 400 }
      )
    }
  }

  // 서비스 생성 — seller_id는 서버에서 인증된 user.id 사용 (클라이언트 조작 불가)
  const { data: service, error: insertError } = await supabase
    .from('services')
    .insert({
      seller_id: user.id,
      category_id: categoryId,
      title: title.trim(),
      description: description?.trim() || '',
      status: status || 'DRAFT',
    })
    .select()
    .single()

  if (insertError || !service) {
    console.error('service insert error:', insertError?.message)
    return NextResponse.json(
      { success: false, error: { code: 'INSERT_ERROR', message: '서비스 등록에 실패했습니다' } },
      { status: 500 }
    )
  }

  // 패키지 생성
  if (packages && Array.isArray(packages) && packages.length > 0) {
    const { error: pkgError } = await supabase.from('service_packages').insert(
      packages.map((p: any) => ({
        service_id: service.id,
        tier: p.tier,
        name: p.name || p.tier,
        description: p.description || '',
        price: p.price,
        work_days: p.workDays,
        revision_count: p.revisionCount || 0,
      }))
    )
    if (pkgError) {
      console.error('package insert error:', pkgError.message)
    }
  }

  // 태그 생성
  if (tags && Array.isArray(tags) && tags.length > 0) {
    const validTags = tags
      .filter((t: unknown) => typeof t === 'string' && t.trim().length > 0)
      .slice(0, MAX_TAGS)
    if (validTags.length > 0) {
      const { error: tagError } = await supabase.from('service_tags').insert(
        validTags.map((tag: string) => ({ service_id: service.id, tag: tag.trim() }))
      )
      if (tagError) {
        console.error('tag insert error:', tagError.message)
      }
    }
  }

  // 판매자 프로필 자동 생성
  const { data: existingProfile } = await supabase
    .from('seller_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!existingProfile) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('nickname')
      .eq('id', user.id)
      .single()
    await supabase.from('seller_profiles').insert({
      user_id: user.id,
      display_name: profile?.nickname || '판매자',
    })
  }

  return NextResponse.json({ success: true, data: { id: service.id } })
}
