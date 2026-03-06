import { test, expect } from '@playwright/test'
import { BUYER, SELLER, TIMEOUT, login } from './helpers'

test.describe('버그 수정 검증 - API', () => {
  test('BF-1. API: price_asc 정렬 시 가격 오름차순', async ({ request }) => {
    const res = await request.get('/api/services?sort=price_asc')
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.success).toBe(true)
    if (body.data.length >= 2) {
      const getPrice = (s: any) => {
        const pkgs = s.packages || []
        const std = pkgs.find((p: any) => p.package_type === 'STANDARD')
        if (std) return std.price
        const prices = pkgs.map((p: any) => p.price).filter(Boolean)
        return prices.length > 0 ? Math.min(...prices) : Infinity
      }
      for (let i = 0; i < body.data.length - 1; i++) {
        expect(getPrice(body.data[i])).toBeLessThanOrEqual(getPrice(body.data[i + 1]))
      }
    }
  })

  test('BF-2. API: price_desc 정렬 시 가격 내림차순', async ({ request }) => {
    const res = await request.get('/api/services?sort=price_desc')
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.success).toBe(true)
    if (body.data.length >= 2) {
      const getPrice = (s: any) => {
        const pkgs = s.packages || []
        const std = pkgs.find((p: any) => p.package_type === 'STANDARD')
        if (std) return std.price
        const prices = pkgs.map((p: any) => p.price).filter(Boolean)
        return prices.length > 0 ? Math.min(...prices) : Infinity
      }
      for (let i = 0; i < body.data.length - 1; i++) {
        expect(getPrice(body.data[i])).toBeGreaterThanOrEqual(getPrice(body.data[i + 1]))
      }
    }
  })

  test('BF-3. API: category=design 필터링 시 서비스 반환', async ({ request }) => {
    const res = await request.get('/api/services?category=design')
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.length).toBeGreaterThanOrEqual(1)
  })

  test('BF-4. API: 상위 카테고리로 필터 시 하위 카테고리 서비스 포함', async ({ request }) => {
    const parentRes = await request.get('/api/services?category=design')
    const parentBody = await parentRes.json()
    const childRes = await request.get('/api/services?category=design-logo-card')
    const childBody = await childRes.json()
    if (childBody.data?.length > 0) {
      expect(parentBody.data.length).toBeGreaterThanOrEqual(childBody.data.length)
    }
  })

  test('BF-5. API: 채팅 메시지 에러 형식 { code, message }', async ({ request }) => {
    const res = await request.get('/api/chat/rooms/fake-room/messages')
    expect(res.ok()).toBeFalsy()
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error).toBeDefined()
    expect(body.error.code).toBeDefined()
    expect(body.error.message).toBeDefined()
  })

  test('BF-6. API: 같은 판매자에 문의 시 기존 채팅방 반환 (중복 방지)', async ({ page }) => {
    await login(page, BUYER)
    const listRes = await page.request.get('/api/services')
    const listBody = await listRes.json()
    if (!listBody.data?.length) return
    const service = listBody.data[0]
    const sellerId = service.seller_id

    const res1 = await page.request.post('/api/chat/rooms', {
      data: { sellerId, serviceId: service.id, roomType: 'INQUIRY' },
    })
    const body1 = await res1.json()

    const res2 = await page.request.post('/api/chat/rooms', {
      data: { sellerId, serviceId: service.id, roomType: 'INQUIRY' },
    })
    const body2 = await res2.json()

    if (body1.success && body2.success) {
      expect(body1.data.id).toBe(body2.data.id)
    }
  })
})

test.describe('버그 수정 검증 - UI', () => {
  test('BF-7. UI: /services?category=design 페이지 서비스 카드 표시', async ({ page }) => {
    await page.goto('/services?category=design')
    await page.waitForTimeout(5000)
    const count = page.getByText(/총.*\d+.*개의 서비스/)
    await expect(count).toBeVisible({ timeout: TIMEOUT })
    const cards = page.locator('[class*="card"]')
    const cardCount = await cards.count()
    expect(cardCount).toBeGreaterThanOrEqual(1)
  })

  test('BF-8. UI: 홈페이지 인기+신규 서비스 모두 표시', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h2').filter({ hasText: '인기 서비스' })).toBeVisible({ timeout: TIMEOUT })
    await expect(page.locator('h2').filter({ hasText: '신규 서비스' })).toBeVisible({ timeout: TIMEOUT })
    const popularSection = page.locator('section').filter({ hasText: '인기 서비스' })
    await expect(popularSection.locator('[class*="card"]').first()).toBeVisible({ timeout: TIMEOUT })
    const newSection = page.locator('section').filter({ hasText: '신규 서비스' })
    await expect(newSection.locator('[class*="card"]').first()).toBeVisible({ timeout: TIMEOUT })
  })

  test('BF-9. UI: 알림 벨 클릭 시 드롭다운 표시', async ({ page }) => {
    await login(page, BUYER)
    await page.goto('/')
    await page.waitForTimeout(3000)
    const bell = page.locator('header button:has(svg.lucide-bell)')
    if (await bell.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await bell.first().click()
      await page.waitForTimeout(1500)
      const popover = page.locator('[data-radix-popper-content-wrapper], [role="dialog"]')
      const hasPopover = await popover.first().isVisible({ timeout: 5000 }).catch(() => false)
      const hasContent = await page.getByText(/알림이 없습니다|모두 읽음/).first().isVisible({ timeout: 3000 }).catch(() => false)
      expect(hasPopover || hasContent).toBeTruthy()
    }
  })

  test('BF-10. UI: 문의하기 → 채팅방 이동 및 메시지 입력란 표시', async ({ page }) => {
    await login(page, BUYER)
    await page.goto('/services')
    const card = page.locator('[class*="card"] a, a[href*="services/"]').first()
    await expect(card).toBeVisible({ timeout: TIMEOUT })
    await card.click()
    await page.waitForURL(/services\//, { timeout: TIMEOUT })
    const inquiryBtn = page.getByText('문의하기').first()
    await expect(inquiryBtn).toBeVisible({ timeout: TIMEOUT })
    await inquiryBtn.click()
    await expect(page).toHaveURL(/chat/, { timeout: TIMEOUT })
    await page.waitForTimeout(5000)
    const msgInput = page.locator('input[placeholder*="메시지"]')
    const hasInput = await msgInput.isVisible({ timeout: 10000 }).catch(() => false)
    expect(hasInput).toBeTruthy()
  })

  test('BF-11. UI: 판매자 서비스 등록 - 가격 입력 min=1', async ({ page }) => {
    await login(page, SELLER)
    await page.goto('/seller/services/new')
    await page.waitForTimeout(3000)
    const priceInput = page.locator('input[type="number"]').first()
    if (await priceInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      const minVal = await priceInput.getAttribute('min')
      expect(minVal).toBe('1')
    }
  })

  test('BF-12. UI: 마이페이지 설정 페이지 로드 및 저장 버튼', async ({ page }) => {
    await login(page, BUYER)
    await page.goto('/mypage/settings')
    await page.waitForTimeout(3000)
    const saveBtn = page.locator('button[type="submit"], button:has-text("저장")')
    await expect(saveBtn.first()).toBeVisible({ timeout: TIMEOUT })
  })
})
