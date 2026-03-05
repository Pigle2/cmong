import { test, expect } from '@playwright/test'

const BUYER = { email: 'buyer1@test.com', password: 'Test1234!' }
const SELLER = { email: 'seller1@test.com', password: 'Test1234!' }

// ===== 1. 페이지 접근 테스트 =====
test.describe('페이지 접근', () => {
  test('홈페이지 로드', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/크몽/)
    await expect(page.getByRole('heading', { name: '인기 서비스' })).toBeVisible({ timeout: 15000 })
  })

  test('로그인 페이지', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByPlaceholder('example@email.com')).toBeVisible()
    await expect(page.getByRole('button', { name: '로그인' })).toBeVisible()
  })

  test('회원가입 페이지', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByPlaceholder('example@email.com')).toBeVisible()
  })

  test('서비스 검색 페이지', async ({ page }) => {
    await page.goto('/services')
    await expect(page.locator('[class*="card"]').first()).toBeVisible({ timeout: 15000 })
  })

  test('비로그인 시 보호 페이지 리다이렉트', async ({ page }) => {
    await page.goto('/orders')
    await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible({ timeout: 10000 })
  })
})

// ===== 2. 로그인 테스트 =====
test.describe('로그인', () => {
  test('구매자 로그인 성공', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', BUYER.email)
    await page.fill('input[type="password"]', BUYER.password)
    await page.click('button[type="submit"]')
    await expect(page).not.toHaveURL(/login/, { timeout: 10000 })
  })

  test('판매자 로그인 성공', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', SELLER.email)
    await page.fill('input[type="password"]', SELLER.password)
    await page.click('button[type="submit"]')
    await expect(page).not.toHaveURL(/login/, { timeout: 10000 })
  })

  test('잘못된 비밀번호 로그인 실패', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', BUYER.email)
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(2000)
    await expect(page).toHaveURL(/login/)
  })
})

// ===== 3. 서비스 목록/검색 테스트 =====
test.describe('서비스', () => {
  test('서비스 목록에 카드 표시', async ({ page }) => {
    await page.goto('/services')
    const cards = page.locator('[class*="card"]')
    await expect(cards.first()).toBeVisible({ timeout: 15000 })
    const count = await cards.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('서비스 검색', async ({ page }) => {
    await page.goto('/services?q=로고')
    await expect(page.locator('text=로고').first()).toBeVisible({ timeout: 10000 })
  })

  test('서비스 상세 페이지', async ({ page }) => {
    await page.goto('/services')
    const firstCard = page.locator('[class*="card"]').first()
    await expect(firstCard).toBeVisible({ timeout: 15000 })
    await firstCard.click()
    await page.waitForURL(/services\//)
    await expect(page.locator('body')).toContainText(/스탠다드|패키지|원/, { timeout: 10000 })
  })
})

// ===== 4. 구매자 전체 플로우 =====
test.describe('구매자 플로우', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', BUYER.email)
    await page.fill('input[type="password"]', BUYER.password)
    await page.click('button[type="submit"]')
    await expect(page).not.toHaveURL(/login/, { timeout: 10000 })
  })

  test('주문 목록 접근', async ({ page }) => {
    await page.goto('/orders')
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10000 })
  })

  test('마이페이지 접근', async ({ page }) => {
    await page.goto('/mypage')
    await expect(page.locator('body')).toContainText(/구매자김철수|buyer1/, { timeout: 15000 })
  })

  test('찜 목록 접근', async ({ page }) => {
    await page.goto('/mypage/favorites')
    await expect(page).toHaveURL(/favorites/)
  })

  test('채팅 페이지 접근', async ({ page }) => {
    await page.goto('/chat')
    // 채팅 목록 또는 빈 상태 메시지
    await expect(page.locator('body')).toContainText(/대화|채팅|메시지|로딩/, { timeout: 15000 })
  })
})

// ===== 5. 판매자 전체 플로우 =====
test.describe('판매자 플로우', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', SELLER.email)
    await page.fill('input[type="password"]', SELLER.password)
    await page.click('button[type="submit"]')
    await expect(page).not.toHaveURL(/login/, { timeout: 10000 })
  })

  test('판매자 대시보드', async ({ page }) => {
    await page.goto('/seller/dashboard')
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10000 })
  })

  test('판매자 서비스 목록', async ({ page }) => {
    await page.goto('/seller/services')
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10000 })
  })

  test('서비스 등록 페이지', async ({ page }) => {
    await page.goto('/seller/services/new')
    await expect(page.getByRole('heading', { name: '새 서비스 등록' })).toBeVisible({ timeout: 10000 })
  })

  test('판매자 주문 관리', async ({ page }) => {
    await page.goto('/seller/orders')
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10000 })
  })

  test('판매자 프로필', async ({ page }) => {
    await page.goto('/seller/profile')
    await expect(page.getByRole('heading', { name: '판매자 프로필' })).toBeVisible({ timeout: 10000 })
  })
})

// ===== 6. API 테스트 =====
test.describe('API', () => {
  test('GET /api/services', async ({ request }) => {
    const res = await request.get('/api/services')
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.length).toBeGreaterThanOrEqual(10)
  })

  test('GET /api/services?q=로고', async ({ request }) => {
    const res = await request.get('/api/services?q=로고')
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.length).toBeGreaterThanOrEqual(1)
  })

  test('GET /api/categories', async ({ request }) => {
    const res = await request.get('/api/categories')
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.length).toBeGreaterThanOrEqual(10)
  })

  test('GET /api/services/:id', async ({ request }) => {
    const listRes = await request.get('/api/services')
    const listBody = await listRes.json()
    const serviceId = listBody.data[0].id

    const res = await request.get(`/api/services/${serviceId}`)
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.title).toBeTruthy()
  })

  test('GET /api/reviews?serviceId=...', async ({ request }) => {
    const listRes = await request.get('/api/services')
    const listBody = await listRes.json()
    const serviceId = listBody.data[0].id

    const res = await request.get(`/api/reviews?serviceId=${serviceId}`)
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.success).toBe(true)
  })
})
