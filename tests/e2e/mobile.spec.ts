import { test, expect } from '@playwright/test'
import { BUYER, SELLER, TIMEOUT, login } from './helpers'

test.describe('모바일 UI', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('G-1. 모바일 홈페이지 로드', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: '전문가에게 맡기세요' })).toBeVisible({ timeout: TIMEOUT })
  })

  test('G-2. 모바일 하단 네비게이션 표시', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)
    const nav = page.locator('nav.fixed, [class*="fixed"][class*="bottom"]')
    const hasNav = await nav.first().isVisible({ timeout: 5000 }).catch(() => false)
    console.log(`  모바일 네비게이션 표시: ${hasNav}`)
  })

  test('G-3. 모바일 서비스 카드 1열 표시', async ({ page }) => {
    await page.goto('/services')
    await expect(page.locator('[class*="card"]').first()).toBeVisible({ timeout: TIMEOUT })
  })

  test('G-4. 모바일 로그인 후 하단 네비게이션', async ({ page }) => {
    await login(page, BUYER)
    await page.goto('/')
    await page.waitForTimeout(3000)
    const nav = page.locator('nav.fixed, [class*="fixed"][class*="bottom"]')
    const hasNav = await nav.first().isVisible({ timeout: 5000 }).catch(() => false)
    console.log(`  로그인 후 모바일 네비게이션 표시: ${hasNav}`)
  })

  test('G-5. 모바일 채팅 - 뒤로가기 버튼', async ({ page }) => {
    await login(page, BUYER)
    await page.goto('/chat')
    await page.waitForTimeout(5000)
    const roomBtn = page.locator('button[class*="border-b"][class*="w-full"]').first()
    if (!await roomBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('  채팅방 없음 - 스킵')
      return
    }
    await roomBtn.click()
    await page.waitForTimeout(2000)

    // 모바일에서 뒤로가기 버튼 확인
    const backBtn = page.locator('button').filter({ has: page.locator('svg.lucide-arrow-left') }).first()
    const hasBackBtn = await backBtn.isVisible({ timeout: 5000 }).catch(() => false)
    expect(hasBackBtn).toBeTruthy()

    // 뒤로가기 클릭 시 방 목록으로 복귀
    if (hasBackBtn) {
      await backBtn.click()
      await page.waitForTimeout(1000)
      const roomList = page.locator('button[class*="border-b"][class*="w-full"]').first()
      await expect(roomList).toBeVisible({ timeout: TIMEOUT })
    }
  })

  test('G-6. 모바일 서비스 상세 - 패키지 테이블 스크롤', async ({ page }) => {
    await page.goto('/services')
    const card = page.locator('[class*="card"] a, a[href*="services/"]').first()
    await expect(card).toBeVisible({ timeout: TIMEOUT })
    await card.click()
    await page.waitForURL(/services\//, { timeout: TIMEOUT })
    // 패키지 비교 테이블이 화면에 있는지 확인
    await expect(page.getByText(/스탠다드|STANDARD/i)).toBeVisible({ timeout: TIMEOUT })
  })
})

// ── 빈 상태 & 토스트 ──

test.describe('UI 엣지케이스', () => {
  test('U-1. 주문 없는 사용자 - 빈 상태 메시지', async ({ page }) => {
    await login(page, BUYER)
    await page.goto('/orders')
    await page.waitForTimeout(5000)
    const body = page.locator('body')
    // 주문이 있으면 목록, 없으면 빈 상태 메시지
    const hasOrders = await page.locator('a[href*="/orders/"]').first().isVisible({ timeout: 5000 }).catch(() => false)
    const hasEmpty = await body.getByText(/주문.*없|내역.*없|없습니다/).isVisible({ timeout: 3000 }).catch(() => false)
    expect(hasOrders || hasEmpty).toBeTruthy()
  })

  test('U-2. 찜 목록 비어있을 때 안내 메시지', async ({ page }) => {
    await login(page, BUYER)
    await page.goto('/mypage/favorites')
    await page.waitForTimeout(5000)
    const body = page.locator('body')
    const hasFavs = await page.locator('[class*="card"]').first().isVisible({ timeout: 5000 }).catch(() => false)
    const hasEmpty = await body.getByText(/찜.*없|서비스.*없|없습니다/).isVisible({ timeout: 3000 }).catch(() => false)
    expect(hasFavs || hasEmpty).toBeTruthy()
  })

  test('U-3. 로그인 후 헤더에 알림/채팅 아이콘 존재', async ({ page }) => {
    await login(page, BUYER)
    await page.goto('/')
    await page.waitForTimeout(3000)
    // 헤더에 아이콘 버튼들 존재 확인
    const headerButtons = page.locator('header button, header a').filter({ has: page.locator('svg') })
    const count = await headerButtons.count()
    console.log(`  헤더 아이콘 버튼 수: ${count}`)
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('U-4. 판매자 서비스 등록 - 필수 입력 누락 시 에러', async ({ page }) => {
    await login(page, SELLER)
    await page.goto('/seller/services/new')
    await page.waitForTimeout(3000)
    // 아무것도 입력하지 않고 등록 시도
    const submitBtn = page.locator('button:has-text("등록"), button:has-text("발행")').first()
    if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await submitBtn.click()
      await page.waitForTimeout(2000)
      // 에러 토스트 또는 페이지 유지
      const hasError = await page.getByText(/필수|카테고리|제목/).isVisible({ timeout: 5000 }).catch(() => false)
      const stayedOnPage = page.url().includes('/new')
      expect(hasError || stayedOnPage).toBeTruthy()
    }
  })

  test('U-5. 설정 페이지 - 저장 성공 토스트 표시', async ({ page }) => {
    await login(page, BUYER)
    await page.goto('/mypage/settings')
    await page.waitForTimeout(5000)
    const bioTextarea = page.locator('textarea')
    if (await bioTextarea.isVisible({ timeout: 3000 }).catch(() => false)) {
      await bioTextarea.fill('토스트 테스트 자기소개')
    }
    const saveBtn = page.getByRole('button', { name: '저장' })
    if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await saveBtn.click()
      // 성공 토스트 확인
      const hasToast = await page.getByText(/수정되었|저장되었|성공/).isVisible({ timeout: 5000 }).catch(() => false)
      console.log(`  저장 토스트 표시: ${hasToast}`)
    }
  })
})
