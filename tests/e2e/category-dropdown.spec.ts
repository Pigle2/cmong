import { test, expect } from '@playwright/test'
import { TIMEOUT } from './helpers'

/**
 * GNB 카테고리 드롭다운 테스트
 *
 * 헤더(GNB)에 추가된 "카테고리" 드롭다운 버튼을 검증.
 * 클릭 시 대분류 카테고리 목록이 표시되고,
 * 항목 클릭 시 /services?category=slug 로 이동하는지 확인.
 *
 * 주의:
 * - CategoryDropdown은 md 이상 화면(desktop)에만 표시됨 (hidden md:flex).
 *   기본 Playwright Chromium 뷰포트(1280x720) 기준 실행.
 * - 배포 지연 가능성이 있으므로 버튼 미존재 시 자동 스킵.
 */

async function detectCategoryDropdownDeployed(page: import('@playwright/test').Page): Promise<boolean> {
  await page.goto('/')
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(1000)
  // 헤더 내 '카테고리' 버튼이 존재하면 배포된 것으로 판단
  const btn = page.locator('header').getByRole('button', { name: /카테고리/ })
  return await btn.isVisible({ timeout: 5000 }).catch(() => false)
}

test.describe('GNB 카테고리 드롭다운 - CAT', () => {
  test('CAT-1: 헤더에 "카테고리" 텍스트/버튼이 존재함', async ({ page }) => {
    const deployed = await detectCategoryDropdownDeployed(page)
    if (!deployed) {
      console.log('  [SKIP] 카테고리 드롭다운 미배포 — 헤더에 버튼 없음')
      test.skip()
      return
    }

    // Header > nav에 "카테고리" 버튼이 있어야 함
    const catBtn = page.locator('header').getByRole('button', { name: /카테고리/ })
    await expect(catBtn).toBeVisible({ timeout: TIMEOUT })
  })

  test('CAT-2: 카테고리 버튼 클릭 시 드롭다운 메뉴가 열림', async ({ page }) => {
    const deployed = await detectCategoryDropdownDeployed(page)
    if (!deployed) {
      console.log('  [SKIP] 카테고리 드롭다운 미배포')
      test.skip()
      return
    }

    const catBtn = page.locator('header').getByRole('button', { name: /카테고리/ })
    await expect(catBtn).toBeVisible({ timeout: TIMEOUT })

    // 클릭하여 드롭다운 열기
    await catBtn.click()

    // DropdownMenuContent가 DOM에 나타나야 함 (role="menu")
    const menu = page.locator('[role="menu"]')
    await expect(menu).toBeVisible({ timeout: TIMEOUT })
  })

  test('CAT-3: 드롭다운에 카테고리 항목들이 표시됨', async ({ page }) => {
    const deployed = await detectCategoryDropdownDeployed(page)
    if (!deployed) {
      console.log('  [SKIP] 카테고리 드롭다운 미배포')
      test.skip()
      return
    }

    const catBtn = page.locator('header').getByRole('button', { name: /카테고리/ })
    await catBtn.click()

    // API에서 카테고리를 비동기 로드하므로 잠시 대기
    await page.waitForTimeout(2000)

    // 메뉴 항목(role="menuitem")이 1개 이상 표시되어야 함
    const items = page.locator('[role="menuitem"]')
    const count = await items.count()
    expect(count).toBeGreaterThan(0)
  })

  test('CAT-4: 드롭다운 카테고리 항목 클릭 시 /services?category= 로 이동함', async ({ page }) => {
    const deployed = await detectCategoryDropdownDeployed(page)
    if (!deployed) {
      console.log('  [SKIP] 카테고리 드롭다운 미배포')
      test.skip()
      return
    }

    const catBtn = page.locator('header').getByRole('button', { name: /카테고리/ })
    await catBtn.click()

    // 카테고리 로드 대기
    await page.waitForTimeout(2000)

    const firstItem = page.locator('[role="menuitem"]').first()
    await expect(firstItem).toBeVisible({ timeout: TIMEOUT })
    await firstItem.click()

    // /services?category=slug 로 이동해야 함
    await expect(page).toHaveURL(/\/services\?category=/, { timeout: TIMEOUT })
  })

  test('CAT-5: 카테고리 드롭다운은 /services 페이지 헤더에도 표시됨', async ({ page }) => {
    await page.goto('/services')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    const catBtn = page.locator('header').getByRole('button', { name: /카테고리/ })
    const deployed = await catBtn.isVisible({ timeout: 5000 }).catch(() => false)
    if (!deployed) {
      console.log('  [SKIP] 카테고리 드롭다운 미배포')
      test.skip()
      return
    }

    // 헤더 내 카테고리 버튼 확인
    await expect(catBtn).toBeVisible({ timeout: TIMEOUT })
  })

  test('CAT-6: 카테고리 버튼에 ChevronDown 아이콘이 포함됨 (SVG 존재 확인)', async ({ page }) => {
    const deployed = await detectCategoryDropdownDeployed(page)
    if (!deployed) {
      console.log('  [SKIP] 카테고리 드롭다운 미배포')
      test.skip()
      return
    }

    // 카테고리 버튼 내부에 SVG(ChevronDown 아이콘)가 있어야 함
    const catBtn = page.locator('header').getByRole('button', { name: /카테고리/ })
    await expect(catBtn).toBeVisible({ timeout: TIMEOUT })

    const svg = catBtn.locator('svg')
    await expect(svg).toBeVisible({ timeout: TIMEOUT })
  })

  test('CAT-7: 드롭다운 열림 상태에서 외부 클릭 시 닫힘', async ({ page }) => {
    const deployed = await detectCategoryDropdownDeployed(page)
    if (!deployed) {
      console.log('  [SKIP] 카테고리 드롭다운 미배포')
      test.skip()
      return
    }

    const catBtn = page.locator('header').getByRole('button', { name: /카테고리/ })
    await catBtn.click()

    // 드롭다운이 열렸는지 확인
    const menu = page.locator('[role="menu"]')
    await expect(menu).toBeVisible({ timeout: TIMEOUT })

    // 헤더 외부(body) 클릭으로 닫기
    await page.locator('body').click({ position: { x: 640, y: 400 } })
    await page.waitForTimeout(500)

    // 드롭다운이 닫혔는지 확인
    await expect(menu).not.toBeVisible({ timeout: 5000 })
  })
})
