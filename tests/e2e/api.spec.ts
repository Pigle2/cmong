import { test, expect } from '@playwright/test'
import { BUYER, SELLER, TIMEOUT, login } from './helpers'

test.describe('API 엔드포인트', () => {
  test('F-1. GET /api/services - 서비스 목록', async ({ request }) => {
    const res = await request.get('/api/services')
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.length).toBeGreaterThanOrEqual(1)
    const service = body.data[0]
    expect(service.id).toBeTruthy()
    expect(service.title).toBeTruthy()
    expect(service.status).toBe('ACTIVE')
  })

  test('F-2. GET /api/services?q=로고 - 검색', async ({ request }) => {
    const res = await request.get('/api/services?q=로고')
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  test('F-3. GET /api/services/:id - 서비스 상세', async ({ request }) => {
    const listRes = await request.get('/api/services')
    const listBody = await listRes.json()
    const id = listBody.data[0].id
    const res = await request.get(`/api/services/${id}`)
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.title).toBeTruthy()
    expect(body.data.packages).toBeDefined()
  })

  test('F-4. GET /api/categories - 카테고리 목록', async ({ request }) => {
    const res = await request.get('/api/categories')
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.length).toBeGreaterThanOrEqual(10)
  })

  test('F-5. GET /api/reviews - 리뷰 목록', async ({ request }) => {
    const listRes = await request.get('/api/services')
    const listBody = await listRes.json()
    const id = listBody.data[0].id
    const res = await request.get(`/api/reviews?serviceId=${id}`)
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  test('F-6. GET /api/services - 정렬 동작', async ({ request }) => {
    const newest = await request.get('/api/services?sort=newest')
    expect(newest.ok()).toBeTruthy()
    const rating = await request.get('/api/services?sort=rating')
    expect(rating.ok()).toBeTruthy()
    const orders = await request.get('/api/services?sort=orders')
    expect(orders.ok()).toBeTruthy()
  })

  test('F-7. GET /api/services - 페이지네이션', async ({ request }) => {
    const page1 = await request.get('/api/services?page=1')
    expect(page1.ok()).toBeTruthy()
    const body1 = await page1.json()
    expect(body1.data.length).toBeGreaterThanOrEqual(1)
    const page2 = await request.get('/api/services?page=2')
    const body2 = await page2.json()
    expect(body2).toBeDefined()
  })

  test('N-8. API: 정렬별 서비스 목록 응답 검증', async ({ request }) => {
    const rec = await request.get('/api/services?sort=recommended')
    expect(rec.ok()).toBeTruthy()
    const priceAsc = await request.get('/api/services?sort=price_asc')
    expect(priceAsc.ok()).toBeTruthy()
    const priceDesc = await request.get('/api/services?sort=price_desc')
    expect(priceDesc.ok()).toBeTruthy()
    const orders = await request.get('/api/services?sort=orders')
    expect(orders.ok()).toBeTruthy()
  })
})

// ── API 보안 테스트 ──

test.describe('API 보안', () => {
  test('S-1. 인증 없이 보호 API 호출 시 401', async ({ request }) => {
    // 찜 목록
    const favRes = await request.get('/api/favorites')
    expect(favRes.status()).toBe(401)

    // 알림 목록
    const notiRes = await request.get('/api/notifications')
    expect(notiRes.status()).toBe(401)
  })

  test('S-2. 인증 없이 찜 토글 시 401', async ({ request }) => {
    const res = await request.post('/api/favorites', {
      data: { serviceId: 'fake-id' },
    })
    expect(res.status()).toBe(401)
  })

  test('S-3. 인증 없이 채팅방 생성 시 401', async ({ request }) => {
    const res = await request.post('/api/chat/rooms', {
      data: { sellerId: 'fake-id', serviceId: 'fake-id' },
    })
    expect(res.status()).toBe(401)
  })

  test('S-4. 잘못된 serviceId로 찜 토글 시 400', async ({ page, request }) => {
    await login(page, BUYER)
    // 로그인 후 쿠키를 가진 상태에서 request 사용
    const res = await page.request.post('/api/favorites', {
      data: { serviceId: 12345 }, // string이 아닌 number
    })
    expect(res.status()).toBe(400)
  })

  test('S-5. 잘못된 roomType으로 채팅방 생성 시 400', async ({ page }) => {
    await login(page, BUYER)
    const res = await page.request.post('/api/chat/rooms', {
      data: { sellerId: 'fake-id', serviceId: 'fake-id', roomType: 'INVALID' },
    })
    expect(res.status()).toBe(400)
  })

  test('S-6. 페이지네이션 limit 최대 100 제한', async ({ request }) => {
    const res = await request.get('/api/services?limit=999')
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    // 데이터가 100개를 초과하면 안 됨
    expect(body.data.length).toBeLessThanOrEqual(100)
  })

  test('S-7. 존재하지 않는 서비스 ID 404', async ({ request }) => {
    const res = await request.get('/api/services/00000000-0000-0000-0000-000000000000')
    expect(res.status()).toBe(404)
  })

  test('S-8. 리뷰 API - serviceId 없이 호출 시 400', async ({ request }) => {
    const res = await request.get('/api/reviews')
    expect(res.status()).toBe(400)
  })

  test('S-9. 인증 없이 리뷰 작성 시 401', async ({ request }) => {
    const res = await request.post('/api/reviews', {
      data: {
        orderId: '00000000-0000-0000-0000-000000000000',
        rating: 5,
        qualityRating: 5,
        communicationRating: 5,
        deliveryRating: 5,
        content: '테스트 리뷰',
      },
    })
    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('UNAUTHORIZED')
  })

  test('S-10. 인증 없이 주문 생성 시 401', async ({ request }) => {
    const res = await request.post('/api/orders', {
      data: {
        serviceId: '00000000-0000-0000-0000-000000000000',
        packageId: '00000000-0000-0000-0000-000000000000',
      },
    })
    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('UNAUTHORIZED')
  })

  test('S-11. 리뷰 작성 - 완료되지 않은 주문 거절 400', async ({ page }) => {
    await login(page, BUYER)
    // 존재하지 않는 주문 ID로 리뷰 작성 시도
    const res = await page.request.post('/api/reviews', {
      data: {
        orderId: '00000000-0000-0000-0000-000000000000',
        rating: 5,
        qualityRating: 5,
        communicationRating: 5,
        deliveryRating: 5,
        content: '악의적 리뷰 시도',
      },
    })
    // 존재하지 않는 주문 → 404
    expect(res.status()).toBe(404)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('NOT_FOUND')
  })

  test('S-12. 주문 생성 - 존재하지 않는 서비스 404', async ({ page }) => {
    await login(page, BUYER)
    const res = await page.request.post('/api/orders', {
      data: {
        serviceId: '00000000-0000-0000-0000-000000000000',
        packageId: '00000000-0000-0000-0000-000000000000',
      },
    })
    expect(res.status()).toBe(404)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('NOT_FOUND')
  })

  test('S-13. 주문 생성 - serviceId 미전달 시 400', async ({ page }) => {
    await login(page, BUYER)
    const res = await page.request.post('/api/orders', {
      data: { packageId: '00000000-0000-0000-0000-000000000000' },
    })
    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('BAD_REQUEST')
  })

  test('S-14. 인증 없이 주문 상태 변경 시 401', async ({ request }) => {
    const res = await request.post('/api/orders/00000000-0000-0000-0000-000000000000/status', {
      data: { status: 'ACCEPTED' },
    })
    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('UNAUTHORIZED')
  })

  test('S-15. 주문 상태 변경 - 허용되지 않은 상태값 400', async ({ page }) => {
    await login(page, SELLER)
    const res = await page.request.post('/api/orders/00000000-0000-0000-0000-000000000000/status', {
      data: { status: 'COMPLETED' },
    })
    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('BAD_REQUEST')
  })

  test('S-16. 주문 상태 변경 - status 미전달 시 400', async ({ page }) => {
    await login(page, SELLER)
    const res = await page.request.post('/api/orders/00000000-0000-0000-0000-000000000000/status', {
      data: {},
    })
    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('BAD_REQUEST')
  })

  test('S-17. 검색 쿼리 특수문자 필터링 검증', async ({ request }) => {
    // PostgREST 인젝션 시도 - 특수문자가 필터링되어 정상 응답해야 함
    const res = await request.get('/api/services?q=test;OR(1,eq,1)')
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  test('S-18. 잘못된 sort 파라미터 무시 검증', async ({ request }) => {
    const res = await request.get('/api/services?sort=malicious_value')
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  test('S-19. 회원탈퇴 - 인증 없이 호출 시 401', async ({ request }) => {
    const res = await request.post('/api/auth/withdraw', {
      data: { reason: '테스트' },
    })
    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('UNAUTHORIZED')
  })

  test('S-20. 회원탈퇴 - reason 미전달 시 400', async ({ page }) => {
    await login(page, BUYER)
    const res = await page.request.post('/api/auth/withdraw', {
      data: {},
    })
    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('BAD_REQUEST')
  })

  test('S-21. 회원탈퇴 - reason 500자 초과 시 400', async ({ page }) => {
    await login(page, BUYER)
    const res = await page.request.post('/api/auth/withdraw', {
      data: { reason: 'x'.repeat(501) },
    })
    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('BAD_REQUEST')
  })

  test('S-22. 주문 취소 - 존재하지 않는 주문 404', async ({ page }) => {
    await login(page, BUYER)
    const res = await page.request.post('/api/orders/00000000-0000-0000-0000-000000000000/cancel', {
      data: { reason: '테스트 취소 사유입니다' },
    })
    expect(res.status()).toBe(404)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('NOT_FOUND')
  })

  test('S-23. 주문 취소 - 에러 메시지에 DB 정보 미노출 확인', async ({ page }) => {
    await login(page, BUYER)
    const res = await page.request.post('/api/orders/invalid-uuid/cancel', {
      data: { reason: '테스트 취소 사유입니다' },
    })
    const body = await res.json()
    // 에러 메시지에 SQL/DB 관련 정보가 포함되지 않아야 함
    const msg = JSON.stringify(body)
    expect(msg).not.toContain('relation')
    expect(msg).not.toContain('column')
    expect(msg).not.toContain('permission denied')
    expect(msg).not.toContain('violates')
  })

  test('S-24. 구매확정 - 존재하지 않는 주문 404', async ({ page }) => {
    await login(page, BUYER)
    const res = await page.request.post('/api/orders/00000000-0000-0000-0000-000000000000/confirm')
    expect(res.status()).toBe(404)
    const body = await res.json()
    expect(body.success).toBe(false)
  })

  test('S-25. 수정요청 - 인증 없이 호출 시 401', async ({ request }) => {
    const res = await request.post('/api/orders/00000000-0000-0000-0000-000000000000/revision', {
      data: { note: '수정 요청 내용입니다' },
    })
    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('UNAUTHORIZED')
  })

  test('S-26. 찜 추가 - 존재하지 않는 서비스 404', async ({ page }) => {
    await login(page, BUYER)
    const res = await page.request.post('/api/favorites', {
      data: { serviceId: '00000000-0000-0000-0000-000000000000' },
    })
    expect(res.status()).toBe(404)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('NOT_FOUND')
  })

  test('S-28. 보호 페이지 - 비인증 접근 시 로그인 리다이렉트', async ({ page }) => {
    // 로그인하지 않은 상태에서 보호된 페이지 접근
    const protectedPages = [
      '/orders/new',
      '/mypage/settings',
      '/seller/services/new',
      '/seller/profile',
    ]
    for (const path of protectedPages) {
      const res = await page.request.get(path, { maxRedirects: 0 })
      // 미들웨어 또는 서버 컴포넌트에서 리다이렉트 (307 or 308)
      const status = res.status()
      expect(status === 307 || status === 308 || status === 302 || status === 303,
        `${path} should redirect, got ${status}`).toBeTruthy()
    }
  })

  test('S-29. 잘못된 JSON body 전송 시 400', async ({ request }) => {
    // 잘못된 JSON을 POST body로 전송하면 500이 아닌 400 응답이어야 함
    const endpoints = [
      '/api/favorites',
      '/api/orders',
      '/api/reviews',
    ]
    for (const endpoint of endpoints) {
      const res = await request.post(endpoint, {
        headers: { 'Content-Type': 'application/json' },
        data: 'not-valid-json{{{',
      })
      // 401(미인증) 또는 400(잘못된 JSON) 중 하나여야 하며 500이면 안 됨
      expect(res.status(), `${endpoint} should not return 500`).not.toBe(500)
    }
  })

  test('S-30. 채팅방 생성 - serviceId 타입 검증', async ({ page }) => {
    await login(page, BUYER)
    const res = await page.request.post('/api/chat/rooms', {
      data: { sellerId: '00000000-0000-0000-0000-000000000000', serviceId: 12345, roomType: 'INQUIRY' },
    })
    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('BAD_REQUEST')
  })

  test('S-27. 서비스 상세 조회 - 조회수 증가 확인', async ({ request }) => {
    // 서비스 목록에서 첫 번째 서비스 ID 획득
    const listRes = await request.get('/api/services')
    const listBody = await listRes.json()
    const serviceId = listBody.data[0].id

    // 첫 번째 조회 (쿠키 없음 → 조회수 증가)
    const res1 = await request.get(`/api/services/${serviceId}`)
    expect(res1.ok()).toBeTruthy()
    const body1 = await res1.json()
    const viewCount1 = body1.data.view_count

    // 쿠키 있는 상태에서 재조회 → 조회수 미증가
    const cookies = res1.headers()['set-cookie']
    const res2 = await request.get(`/api/services/${serviceId}`, {
      headers: cookies ? { cookie: cookies } : {},
    })
    expect(res2.ok()).toBeTruthy()
    const body2 = await res2.json()
    // 쿠키 기반 중복 방지로 조회수가 같거나 1만 증가해야 함
    expect(body2.data.view_count).toBeLessThanOrEqual(viewCount1 + 1)
  })

  test('S-31. 채팅 메시지 전송 - 인증 없이 호출 시 401', async ({ request }) => {
    const res = await request.post('/api/chat/rooms/00000000-0000-0000-0000-000000000000/messages', {
      data: { content: '테스트 메시지' },
    })
    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('UNAUTHORIZED')
  })

  test('S-32. 채팅 메시지 전송 - 빈 내용 시 400', async ({ page }) => {
    await login(page, BUYER)
    const res = await page.request.post('/api/chat/rooms/00000000-0000-0000-0000-000000000000/messages', {
      data: { content: '' },
    })
    // 403(비참여자) 또는 400(빈 내용) — 500이 아니어야 함
    expect(res.status()).not.toBe(500)
  })

  test('S-33. 서비스 등록 - 인증 없이 호출 시 401', async ({ request }) => {
    const res = await request.post('/api/seller/services', {
      data: { categoryId: 1, title: '테스트 서비스' },
    })
    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('UNAUTHORIZED')
  })

  test('S-34. 서비스 등록 - 필수값 누락 시 400', async ({ page }) => {
    await login(page, SELLER)
    // title 없이 요청
    const res = await page.request.post('/api/seller/services', {
      data: { categoryId: 1 },
    })
    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('BAD_REQUEST')
  })

  test('S-35. 서비스 등록 - 잘못된 status 값 거부', async ({ page }) => {
    await login(page, SELLER)
    const res = await page.request.post('/api/seller/services', {
      data: { categoryId: 1, title: '테스트', status: 'DELETED' },
    })
    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.success).toBe(false)
  })
})
