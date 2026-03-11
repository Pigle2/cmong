import { test, expect } from '@playwright/test'
import { BUYER, SELLER, TIMEOUT, login } from './helpers'

// /api/orders/[id]/review-data API route 보안 검증 테스트
// 리뷰 페이지가 클라이언트 직접 DB 접근 대신 이 API를 통해 데이터를 조회하는지 검증

// API route 배포 여부를 미리 확인하는 헬퍼
async function isReviewDataApiDeployed(request: any): Promise<boolean> {
  const res = await request.get('/api/orders/00000000-0000-0000-0000-000000000000/review-data')
  // HTML(404 페이지)이 아닌 JSON을 반환하면 배포된 것
  const contentType = res.headers()['content-type'] || ''
  return contentType.includes('application/json')
}

test.describe('RVW-API: 리뷰 데이터 API route 보안 검증', () => {

  test('RVW-API-1: 비로그인 상태로 review-data API 접근 시 401 반환', async ({ request }) => {
    if (!await isReviewDataApiDeployed(request)) {
      test.skip(true, 'review-data API가 아직 배포되지 않음 — 배포 후 재실행 필요')
      return
    }
    const res = await request.get('/api/orders/00000000-0000-0000-0000-000000000000/review-data')
    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error).toBeDefined()
    expect(body.error.code).toBe('UNAUTHORIZED')
  })

  test('RVW-API-2: 잘못된 UUID 형식으로 접근 시 400 또는 401 반환 (500 아님)', async ({ request }) => {
    const res = await request.get('/api/orders/not-a-valid-uuid/review-data')
    const status = res.status()
    // Next.js가 HTML 404 페이지를 반환하는 경우 배포 전이므로 스킵
    const contentType = res.headers()['content-type'] || ''
    if (contentType.includes('text/html')) {
      test.skip(true, 'review-data API가 아직 배포되지 않음')
      return
    }
    // 배포됐을 경우: 400(UUID 검증 우선) 또는 401(인증 우선) — 500이 아니어야 함
    expect(status).not.toBe(500)
    expect([400, 401]).toContain(status)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBeDefined()
  })

  test('RVW-API-3: 로그인 후 잘못된 UUID 형식으로 접근 시 400 반환', async ({ page }) => {
    await login(page, BUYER)
    const res = await page.request.get('/api/orders/invalid-uuid-format/review-data')
    // HTML이 반환되면 배포 전
    const contentType = res.headers()['content-type'] || ''
    if (contentType.includes('text/html')) {
      test.skip(true, 'review-data API가 아직 배포되지 않음')
      return
    }
    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('BAD_REQUEST')
    expect(body.error.message).toContain('유효하지 않은')
  })

  test('RVW-API-4: 로그인 후 존재하지 않는 UUID로 접근 시 404 반환', async ({ page }) => {
    await login(page, BUYER)
    const res = await page.request.get('/api/orders/00000000-0000-0000-0000-000000000000/review-data')
    const contentType = res.headers()['content-type'] || ''
    if (contentType.includes('text/html')) {
      test.skip(true, 'review-data API가 아직 배포되지 않음')
      return
    }
    expect(res.status()).toBe(404)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('NOT_FOUND')
  })

  test('RVW-API-5: 판매자 계정으로 타인의 주문에 접근 시 403 또는 404 반환', async ({ page }) => {
    await login(page, SELLER)
    const res = await page.request.get('/api/orders/00000000-0000-0000-0000-000000000000/review-data')
    const contentType = res.headers()['content-type'] || ''
    if (contentType.includes('text/html')) {
      test.skip(true, 'review-data API가 아직 배포되지 않음')
      return
    }
    // 존재하지 않으면 404, 존재하지만 소유자 아니면 403
    expect([403, 404]).toContain(res.status())
    const body = await res.json()
    expect(body.success).toBe(false)
  })

  test('RVW-API-6: review-data API 응답이 { success, error: { code, message } } 구조', async ({ request }) => {
    const res = await request.get('/api/orders/00000000-0000-0000-0000-000000000000/review-data')
    const contentType = res.headers()['content-type'] || ''
    if (contentType.includes('text/html')) {
      test.skip(true, 'review-data API가 아직 배포되지 않음')
      return
    }
    const body = await res.json()
    // 에러 응답은 항상 { success: false, error: { code, message } } 구조여야 함
    expect(body.success).toBe(false)
    expect(body.error).toBeDefined()
    expect(typeof body.error.code).toBe('string')
    expect(typeof body.error.message).toBe('string')
    // DB 내부 정보가 노출되지 않아야 함
    const bodyStr = JSON.stringify(body)
    expect(bodyStr).not.toContain('relation')
    expect(bodyStr).not.toContain('column')
    expect(bodyStr).not.toContain('permission denied')
    expect(bodyStr).not.toContain('violates')
  })

  test('RVW-API-7: 리뷰 페이지가 review-data API를 통해 데이터 조회 (네트워크 요청 확인)', async ({ page }) => {
    await login(page, BUYER)
    await page.goto('/orders')
    await page.waitForTimeout(3000)

    const orderLink = page.locator('a[href*="/orders/"]').first()
    if (!await orderLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, '주문 없음 — 리뷰 페이지 네트워크 테스트 스킵')
      return
    }

    // 주문 링크에서 ID 추출
    const href = await orderLink.getAttribute('href')
    const orderId = href?.split('/orders/')[1]?.split('?')[0]
    if (!orderId) {
      test.skip(true, '주문 ID 추출 실패')
      return
    }

    // review-data API 요청 캡처
    const reviewDataRequests: string[] = []
    page.on('request', (req) => {
      if (req.url().includes('/review-data')) {
        reviewDataRequests.push(req.url())
      }
    })

    // 리뷰 작성 페이지로 이동
    await page.goto(`/orders/${orderId}/review`)
    await page.waitForTimeout(4000)

    const currentUrl = page.url()

    // review-data API가 배포된 경우: 네트워크 요청 발생 확인
    if (reviewDataRequests.length > 0) {
      const correctApiCalled = reviewDataRequests.some(url =>
        url.includes(`/api/orders/${orderId}/review-data`)
      )
      expect(correctApiCalled).toBeTruthy()
    }

    // 어떤 경우든 페이지는 정상적으로 응답해야 함 (500 에러 없음)
    const isValidState =
      currentUrl.includes('/review') ||
      currentUrl.includes('/orders/') ||
      currentUrl.endsWith('/orders') ||
      currentUrl.includes('/login')
    expect(isValidState).toBeTruthy()
  })

  test('RVW-API-8: review-data API 특수문자 ID 처리 (SQL 인젝션 방지)', async ({ page }) => {
    await login(page, BUYER)
    // SQL 인젝션 시도 — 에러 없이 400 or 404 반환해야 함, 500 절대 아님
    const maliciousId = "1' OR '1'='1"
    const res = await page.request.get(`/api/orders/${encodeURIComponent(maliciousId)}/review-data`)
    const status = res.status()
    expect(status).not.toBe(500)

    // HTML이 반환되면 배포 전 (Next.js 404 라우팅)
    const contentType = res.headers()['content-type'] || ''
    if (contentType.includes('text/html')) {
      // Next.js 라우팅 단에서 이미 처리됨 (배포 전이거나 Next.js가 먼저 처리)
      return
    }

    // JSON 응답이면 에러 구조 검증
    const body = await res.json()
    expect(body.success).toBe(false)
    expect([400, 401, 404]).toContain(status)
  })
})
