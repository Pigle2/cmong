import { test, expect } from '@playwright/test'

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
