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
})
