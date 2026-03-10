import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const VALID_TIERS = ['STANDARD', 'DELUXE', 'PREMIUM']
const MAX_TAGS = 20
const MAX_TAG_LENGTH = 50
const MAX_PRICE = 100_000_000
const MAX_WORK_DAYS = 365

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

  const { title, description, categoryId, packages, tags } = body

  // 입력값 검증
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

  if (categoryId !== undefined && (typeof categoryId !== 'number' || categoryId <= 0)) {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: '유효한 카테고리 ID가 필요합니다' } },
      { status: 400 }
    )
  }

  // 서비스 조회 + 소유자 검증
  const { data: service, error: fetchError } = await supabase
    .from('services')
    .select('id, seller_id, status')
    .eq('id', params.id)
    .single()

  if (fetchError || !service) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: '서비스를 찾을 수 없습니다' } },
      { status: 404 }
    )
  }

  if (service.seller_id !== user.id) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: '본인의 서비스만 수정할 수 있습니다' } },
      { status: 403 }
    )
  }

  if (service.status === 'DELETED') {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_ALLOWED', message: '삭제된 서비스는 수정할 수 없습니다' } },
      { status: 400 }
    )
  }

  // 카테고리 변경 시 존재 여부 확인
  if (categoryId !== undefined) {
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
  }

  // 서비스 정보 UPDATE (status는 변경하지 않음)
  const updateData: Record<string, unknown> = {
    title: title.trim(),
    description: description?.trim() || '',
    updated_at: new Date().toISOString(),
  }
  if (categoryId !== undefined) {
    updateData.category_id = categoryId
  }

  const { error: updateError } = await supabase
    .from('services')
    .update(updateData)
    .eq('id', params.id)
    .eq('seller_id', user.id)

  if (updateError) {
    console.error('service update error:', updateError.message)
    return NextResponse.json(
      { success: false, error: { code: 'UPDATE_ERROR', message: '서비스 수정에 실패했습니다' } },
      { status: 500 }
    )
  }

  // 패키지 처리
  const errors: string[] = []
  if (packages && Array.isArray(packages)) {
    for (const pkg of packages) {
      if (!VALID_TIERS.includes(pkg.tier)) continue
      if (typeof pkg.price !== 'number' || pkg.price <= 0 || pkg.price > MAX_PRICE) continue
      if (typeof pkg.workDays !== 'number' || pkg.workDays <= 0 || pkg.workDays > MAX_WORK_DAYS) continue
      const revisionCount = typeof pkg.revisionCount === 'number' ? Math.max(0, pkg.revisionCount) : 0

      const data = {
        service_id: params.id,
        tier: pkg.tier,
        name: pkg.name || pkg.tier,
        description: pkg.description || '',
        price: pkg.price,
        work_days: pkg.workDays,
        revision_count: revisionCount,
      }

      if (pkg.id) {
        const { error } = await supabase.from('service_packages').update(data).eq('id', pkg.id).eq('service_id', params.id)
        if (error) {
          console.error('package update error:', error.message)
          errors.push('패키지 수정 실패')
        }
      } else {
        const { error } = await supabase.from('service_packages').insert(data)
        if (error) {
          console.error('package insert error:', error.message)
          errors.push('패키지 추가 실패')
        }
      }
    }
  }

  // 태그 처리: 기존 삭제 후 재삽입
  const { error: tagDeleteError } = await supabase.from('service_tags').delete().eq('service_id', params.id)
  if (tagDeleteError) {
    console.error('tag delete error:', tagDeleteError.message)
    errors.push('태그 삭제 실패')
  }

  if (tags && Array.isArray(tags) && tags.length > 0) {
    const validTags = tags
      .filter((t: unknown) => typeof t === 'string' && t.trim().length > 0 && t.trim().length <= MAX_TAG_LENGTH)
      .slice(0, MAX_TAGS)
    if (validTags.length > 0) {
      const { error: tagInsertError } = await supabase.from('service_tags').insert(
        validTags.map((tag: string) => ({ service_id: params.id, tag: tag.trim() }))
      )
      if (tagInsertError) {
        console.error('tag insert error:', tagInsertError.message)
        errors.push('태그 저장 실패')
      }
    }
  }

  if (errors.length > 0) {
    return NextResponse.json(
      { success: false, error: { code: 'PARTIAL_ERROR', message: '일부 항목 저장에 실패했습니다: ' + errors.join(', ') } },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' } },
      { status: 401 }
    )
  }

  // 서비스 조회 + 소유자 검증
  const { data: service, error: fetchError } = await supabase
    .from('services')
    .select('id, seller_id, status')
    .eq('id', params.id)
    .single()

  if (fetchError || !service) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: '서비스를 찾을 수 없습니다' } },
      { status: 404 }
    )
  }

  if (service.seller_id !== user.id) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: '본인의 서비스만 삭제할 수 있습니다' } },
      { status: 403 }
    )
  }

  if (service.status === 'DELETED') {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_ALLOWED', message: '이미 삭제된 서비스입니다' } },
      { status: 400 }
    )
  }

  // 서비스 soft delete + 관련 데이터 정리
  const { error: updateError } = await supabase
    .from('services')
    .update({ status: 'DELETED', updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('seller_id', user.id)

  if (updateError) {
    console.error('service delete error:', updateError.message)
    return NextResponse.json(
      { success: false, error: { code: 'UPDATE_ERROR', message: '서비스 삭제에 실패했습니다' } },
      { status: 500 }
    )
  }

  // 고아 데이터 정리: 관련 데이터 일괄 삭제
  await Promise.all([
    supabase.from('favorites').delete().eq('service_id', params.id),
    supabase.from('service_tags').delete().eq('service_id', params.id),
    supabase.from('service_images').delete().eq('service_id', params.id),
    supabase.from('service_packages').delete().eq('service_id', params.id),
  ])

  return NextResponse.json({ success: true })
}
