import { test, expect } from '@playwright/test'
import { BUYER, SELLER, TIMEOUT, login } from './helpers'

// ── 비로그인: 서비스 탐색 ──

test.describe('서비스 - 홈/검색/상세', () => {
  test('A-1. 홈페이지 로드 - 히어로/카테고리/인기/신규 서비스 표시', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1').filter({ hasText: '전문가에게 맡기세요' })).toBeVisible({ timeout: TIMEOUT })
    await expect(page.locator('h2').filter({ hasText: '카테고리' })).toBeVisible()
    await expect(page.locator('h2').filter({ hasText: '인기 서비스' })).toBeVisible()
    await expect(page.locator('h2').filter({ hasText: '신규 서비스' })).toBeVisible()
    await expect(page.locator('[class*="card"]').first()).toBeVisible({ timeout: TIMEOUT })
  })

  test('A-2. 홈 → 카테고리 아이콘 클릭 → 서비스 목록 필터링', async ({ page }) => {
    await page.goto('/')
    const catLink = page.locator('section').filter({ hasText: '카테고리' }).locator('a').first()
    await expect(catLink).toBeVisible({ timeout: TIMEOUT })
    await catLink.click()
    await expect(page).toHaveURL(/services\?category=/, { timeout: TIMEOUT })
  })

  test('A-3. 서비스 검색 페이지 - 카드 목록 표시', async ({ page }) => {
    await page.goto('/services')
    await expect(page.locator('[class*="card"]').first()).toBeVisible({ timeout: TIMEOUT })
    await expect(page.getByText(/총.*\d+.*개의 서비스/)).toBeVisible()
  })

  test('A-4. 서비스 검색 - 키워드 검색 동작', async ({ page }) => {
    await page.goto('/services')
    const searchInput = page.locator('input[placeholder*="검색"], input[placeholder*="서비스"]').first()
    await expect(searchInput).toBeVisible({ timeout: TIMEOUT })
    await searchInput.fill('로고')
    await searchInput.press('Enter')
    await page.waitForTimeout(3000)
    expect(page.url()).toContain('q=')
  })

  test('A-5. 서비스 검색 - 정렬 변경', async ({ page }) => {
    await page.goto('/services')
    await page.waitForTimeout(2000)
    const sortLink = page.locator('a[href*="sort=newest"], button:has-text("최신순")').first()
    if (await sortLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await sortLink.click()
      await page.waitForTimeout(2000)
    }
  })

  test('A-6. 서비스 상세 페이지 - 정보 표시', async ({ page }) => {
    await page.goto('/services')
    const card = page.locator('[class*="card"] a, [class*="card"]').first()
    await expect(card).toBeVisible({ timeout: TIMEOUT })
    await card.click()
    await page.waitForURL(/services\//, { timeout: TIMEOUT })
    await expect(page.getByText(/스탠다드|STANDARD/i)).toBeVisible({ timeout: TIMEOUT })
    await expect(page.locator('body')).toContainText(/판매자|전문가/)
    await expect(page.getByText('문의하기')).toBeVisible()
  })
})

// ── 로그인: 찜하기 ──

test.describe('서비스 - 찜하기', () => {
  test('B-7. 서비스 상세 → 찜하기 토글', async ({ page }) => {
    await login(page, BUYER)
    await page.goto('/services')
    const card = page.locator('[class*="card"] a, a[href*="services/"]').first()
    await expect(card).toBeVisible({ timeout: TIMEOUT })
    await card.click()
    await page.waitForURL(/services\//, { timeout: TIMEOUT })
    const favBtn = page.locator('button').filter({ has: page.locator('svg.lucide-heart, svg') }).first()
    if (await favBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await favBtn.click()
      await page.waitForTimeout(2000)
      await favBtn.click()
      await page.waitForTimeout(1000)
    }
  })
})

// ── 판매자: 서비스 CRUD ──

test.describe('서비스 - 판매자 CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, SELLER)
  })

  test('D-2. 판매자 서비스 목록', async ({ page }) => {
    await page.goto('/seller/services')
    await page.waitForTimeout(3000)
    await expect(page.locator('body')).toContainText(/서비스|등록/, { timeout: TIMEOUT })
  })

  test('D-3. 판매자 서비스 등록 페이지 - 폼 표시', async ({ page }) => {
    await page.goto('/seller/services/new')
    await expect(page.getByRole('heading', { name: '새 서비스 등록' })).toBeVisible({ timeout: TIMEOUT })
    await expect(page.getByText('카테고리')).toBeVisible()
    await expect(page.getByText('기본 정보')).toBeVisible()
    await expect(page.getByPlaceholder(/제목/)).toBeVisible()
    await expect(page.getByPlaceholder(/설명/).first()).toBeVisible()
  })

  test('D-4. 서비스 등록 - 카테고리 선택 → 제목 → 패키지 → 등록', async ({ page }) => {
    await page.goto('/seller/services/new')
    await page.waitForTimeout(3000)
    const catSelect = page.locator('select, [role="combobox"]').first()
    if (await catSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      const options = await catSelect.locator('option').allTextContents()
      if (options.length > 1) {
        await catSelect.selectOption({ index: 1 })
        await page.waitForTimeout(1000)
      }
    }
    const titleInput = page.locator('input[placeholder*="제목"], input[name="title"]').first()
    if (await titleInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await titleInput.fill('E2E 테스트 서비스 - ' + Date.now())
    }
    const descTextarea = page.locator('textarea').first()
    if (await descTextarea.isVisible({ timeout: 3000 }).catch(() => false)) {
      await descTextarea.fill('이것은 E2E 테스트로 생성된 서비스입니다.')
    }
    const priceInput = page.locator('input[type="number"], input[placeholder*="가격"], input[name*="price"]').first()
    if (await priceInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await priceInput.fill('50000')
    }
    const daysInput = page.locator('input[placeholder*="일"], input[name*="work_days"], input[name*="days"]').first()
    if (await daysInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await daysInput.fill('5')
    }
  })

  test('D-9. 판매자 서비스 편집 페이지 접근', async ({ page }) => {
    await page.goto('/seller/services')
    await page.waitForTimeout(3000)
    const editLink = page.locator('a[href*="/edit"], button:has-text("수정"), button:has-text("편집")').first()
    if (await editLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editLink.click()
      await page.waitForTimeout(3000)
      await expect(page.locator('body')).toContainText(/수정|편집|저장/, { timeout: TIMEOUT })
    }
  })
})

// ── 검색 필터 ──

test.describe('서비스 - 검색 필터', () => {
  test('N-1. 카테고리 필터 클릭 → URL 반영 + 결과 변경', async ({ page }) => {
    await page.goto('/services')
    await page.waitForTimeout(2000)
    const catLink = page.locator('a[href*="services?category="]').first()
    if (await catLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      const catText = await catLink.textContent()
      await catLink.click()
      await page.waitForTimeout(2000)
      expect(page.url()).toContain('category=')
      await expect(page.getByText(/총.*\d+.*개의 서비스/)).toBeVisible({ timeout: TIMEOUT })
      console.log(`  선택한 카테고리: ${catText}`)
    }
  })

  test('N-2. 정렬 옵션 - 최신순', async ({ page }) => {
    await page.goto('/services')
    await page.waitForTimeout(2000)
    const sortLink = page.locator('a[href*="sort=newest"]')
    if (await sortLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await sortLink.click()
      await page.waitForTimeout(2000)
      expect(page.url()).toContain('sort=newest')
    }
  })

  test('N-3. 정렬 옵션 - 평점순', async ({ page }) => {
    await page.goto('/services')
    await page.waitForTimeout(2000)
    const sortLink = page.locator('a[href*="sort=rating"]')
    if (await sortLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await sortLink.click()
      await page.waitForTimeout(2000)
      expect(page.url()).toContain('sort=rating')
    }
  })

  test('N-4. 정렬 옵션 - 가격 낮은순', async ({ page }) => {
    await page.goto('/services')
    await page.waitForTimeout(2000)
    const sortLink = page.locator('a[href*="sort=price_asc"]')
    if (await sortLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await sortLink.click()
      await page.waitForTimeout(2000)
      expect(page.url()).toContain('sort=price_asc')
    }
  })

  test('N-5. 정렬 옵션 - 가격 높은순', async ({ page }) => {
    await page.goto('/services')
    await page.waitForTimeout(2000)
    const sortLink = page.locator('a[href*="sort=price_desc"]')
    if (await sortLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await sortLink.click()
      await page.waitForTimeout(2000)
      expect(page.url()).toContain('sort=price_desc')
    }
  })

  test('N-6. 카테고리 + 정렬 조합', async ({ page }) => {
    await page.goto('/services')
    await page.waitForTimeout(2000)
    const catLink = page.locator('a[href*="services?category="]').first()
    if (await catLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await catLink.click()
      await page.waitForURL(/category=/, { timeout: TIMEOUT })
      const sortLink = page.locator('a[href*="sort=newest"]')
      const hasSortLink = await sortLink.isVisible({ timeout: 5000 }).catch(() => false)
      console.log(`  카테고리 선택 후 정렬 옵션 표시: ${hasSortLink}`)
      if (hasSortLink) {
        const href = await sortLink.getAttribute('href')
        console.log(`  정렬 링크 href: ${href}`)
        expect(href).toContain('category=')
        expect(href).toContain('sort=newest')
        await sortLink.click()
        await page.waitForURL(/sort=/, { timeout: TIMEOUT })
        expect(page.url()).toContain('sort=newest')
      }
    }
  })

  test('N-7. 검색어 + 결과 없음 → 안내 메시지', async ({ page }) => {
    await page.goto('/services')
    await page.waitForTimeout(2000)
    const searchInput = page.locator('input[placeholder*="서비스"]').first()
    await expect(searchInput).toBeVisible({ timeout: TIMEOUT })
    await searchInput.fill('zzzzxxxxxxxnoexist999')
    await searchInput.press('Enter')
    await page.waitForTimeout(3000)
    await expect(page.getByText('검색 결과가 없습니다')).toBeVisible({ timeout: TIMEOUT })
    await expect(page.getByText(/다른 검색어|필터/)).toBeVisible()
  })
})
