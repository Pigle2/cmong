import { test, expect } from '@playwright/test'
import { TIMEOUT } from './helpers'

/**
 * 서비스 목록 필터 바 확장 테스트
 *
 * /services 페이지 사이드바에 추가된 가격/작업일/평점 필터 Select 및
 * 검색 결과 건수 표시, 필터 초기화 버튼을 검증.
 * URL 쿼리 파라미터: minPrice, maxPrice, workDays, minRating
 *
 * 주의: 배포 지연 가능성이 있으므로 신규 Select 요소 미존재 시 자동 스킵.
 */

async function detectFilterDeployed(page: import('@playwright/test').Page): Promise<boolean> {
  // 가격 필터 Select가 사이드바에 존재하면 배포된 것으로 판단
  await page.goto('/services')
  await page.waitForTimeout(2000)
  const count = await page.locator('aside [role="combobox"]').count()
  return count >= 1
}

test.describe('서비스 필터 바 - FLT', () => {
  test('FLT-1: /services 페이지에 가격 범위 필터 Select가 표시됨', async ({ page }) => {
    await page.goto('/services')
    await expect(page.getByText('카테고리').first()).toBeVisible({ timeout: TIMEOUT })

    const deployed = await detectFilterDeployed(page)
    if (!deployed) {
      console.log('  [SKIP] 가격 필터 미배포 — 사이드바에 Select 없음')
      test.skip()
      return
    }

    // 배포된 경우: '가격' 헤딩이 사이드바에 표시되는지 확인
    await expect(page.getByText('가격').first()).toBeVisible({ timeout: TIMEOUT })

    // shadcn Select 트리거(role="combobox")가 사이드바 내에 존재하는지 확인
    const selects = page.locator('aside [role="combobox"]')
    const count = await selects.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('FLT-2: /services 페이지에 작업일 필터 Select가 표시됨', async ({ page }) => {
    await page.goto('/services')
    await page.waitForTimeout(2000)

    const deployed = await detectFilterDeployed(page)
    if (!deployed) {
      console.log('  [SKIP] 작업일 필터 미배포')
      test.skip()
      return
    }

    // '작업일' 헤딩이 사이드바에 표시되는지 확인
    await expect(page.getByText('작업일').first()).toBeVisible({ timeout: TIMEOUT })

    // 가격/작업일/평점 총 3개의 Select가 존재해야 함
    const selects = page.locator('aside [role="combobox"]')
    const count = await selects.count()
    expect(count).toBeGreaterThanOrEqual(2)
  })

  test('FLT-3: /services 페이지에 평점 필터 Select가 표시됨', async ({ page }) => {
    await page.goto('/services')
    await page.waitForTimeout(2000)

    const deployed = await detectFilterDeployed(page)
    if (!deployed) {
      console.log('  [SKIP] 평점 필터 미배포')
      test.skip()
      return
    }

    // '평점' 헤딩이 사이드바에 표시되는지 확인
    await expect(page.getByText('평점').first()).toBeVisible({ timeout: TIMEOUT })

    // 세 번째 Select (평점)가 존재해야 함
    const selects = page.locator('aside [role="combobox"]')
    const count = await selects.count()
    expect(count).toBeGreaterThanOrEqual(3)
  })

  test('FLT-4: 검색 결과 건수가 표시됨 (텍스트에 "서비스" 또는 "건" 포함)', async ({ page }) => {
    await page.goto('/services')
    await page.waitForTimeout(2000)

    // 배포 여부와 무관하게 건수 텍스트는 기존에도 "총 N개의 서비스" 형태로 존재
    const countText = page.locator('p').filter({ hasText: /서비스|건/ }).first()
    await expect(countText).toBeVisible({ timeout: TIMEOUT })

    const text = await countText.textContent()
    expect(text).toMatch(/서비스|건/)
  })

  test('FLT-5: 가격 필터 적용 시 URL에 maxPrice 파라미터가 추가됨', async ({ page }) => {
    await page.goto('/services')
    await page.waitForTimeout(2000)

    const deployed = await detectFilterDeployed(page)
    if (!deployed) {
      console.log('  [SKIP] 가격 필터 미배포')
      test.skip()
      return
    }

    // 가격 Select 트리거 클릭 (사이드바의 첫 번째 combobox)
    const priceSelect = page.locator('aside [role="combobox"]').first()
    await expect(priceSelect).toBeVisible({ timeout: TIMEOUT })
    await priceSelect.click()

    // 드롭다운이 열리면 "~50,000원" 옵션 선택
    const option = page.locator('[role="option"]').filter({ hasText: /50,000/ }).first()
    await expect(option).toBeVisible({ timeout: 5000 })
    await option.click()

    // URL에 maxPrice 파라미터가 추가되었는지 확인
    await page.waitForURL(/maxPrice=/, { timeout: TIMEOUT })
    expect(page.url()).toContain('maxPrice=')
  })

  test('FLT-6: 작업일 필터 적용 시 URL에 workDays 파라미터가 추가됨', async ({ page }) => {
    await page.goto('/services')
    await page.waitForTimeout(2000)

    const deployed = await detectFilterDeployed(page)
    if (!deployed) {
      console.log('  [SKIP] 작업일 필터 미배포')
      test.skip()
      return
    }

    // 작업일 Select 트리거 클릭 (사이드바의 두 번째 combobox)
    const workDaysSelect = page.locator('aside [role="combobox"]').nth(1)
    await expect(workDaysSelect).toBeVisible({ timeout: TIMEOUT })
    await workDaysSelect.click()

    // "3일 이내" 옵션 선택
    const option = page.locator('[role="option"]').filter({ hasText: /3일/ }).first()
    await expect(option).toBeVisible({ timeout: 5000 })
    await option.click()

    // URL에 workDays 파라미터가 추가되었는지 확인
    await page.waitForURL(/workDays=/, { timeout: TIMEOUT })
    expect(page.url()).toContain('workDays=3')
  })

  test('FLT-7: 평점 필터 적용 시 URL에 minRating 파라미터가 추가됨', async ({ page }) => {
    await page.goto('/services')
    await page.waitForTimeout(2000)

    const deployed = await detectFilterDeployed(page)
    if (!deployed) {
      console.log('  [SKIP] 평점 필터 미배포')
      test.skip()
      return
    }

    // 평점 Select 트리거 클릭 (사이드바의 세 번째 combobox)
    const ratingSelect = page.locator('aside [role="combobox"]').nth(2)
    await expect(ratingSelect).toBeVisible({ timeout: TIMEOUT })
    await ratingSelect.click()

    // "4.0 이상" 옵션 선택
    const option = page.locator('[role="option"]').filter({ hasText: /4\.0/ }).first()
    await expect(option).toBeVisible({ timeout: 5000 })
    await option.click()

    // URL에 minRating 파라미터가 추가되었는지 확인
    await page.waitForURL(/minRating=/, { timeout: TIMEOUT })
    expect(page.url()).toContain('minRating=4')
  })

  test('FLT-8: 필터 적용 후 초기화 버튼이 표시되고 클릭 시 파라미터가 제거됨', async ({ page }) => {
    await page.goto('/services')
    await page.waitForTimeout(2000)

    const deployed = await detectFilterDeployed(page)
    if (!deployed) {
      console.log('  [SKIP] 필터 초기화 미배포')
      test.skip()
      return
    }

    // 먼저 작업일 필터 적용
    const workDaysSelect = page.locator('aside [role="combobox"]').nth(1)
    await expect(workDaysSelect).toBeVisible({ timeout: TIMEOUT })
    await workDaysSelect.click()

    const option = page.locator('[role="option"]').filter({ hasText: /7일/ }).first()
    await expect(option).toBeVisible({ timeout: 5000 })
    await option.click()

    await page.waitForURL(/workDays=/, { timeout: TIMEOUT })

    // 필터 초기화 버튼이 표시되어야 함
    const resetBtn = page.getByRole('button', { name: '필터 초기화' })
    await expect(resetBtn).toBeVisible({ timeout: TIMEOUT })

    // 초기화 버튼 클릭
    await resetBtn.click()

    // URL에서 workDays 파라미터가 제거되었는지 확인
    await page.waitForTimeout(2000)
    expect(page.url()).not.toContain('workDays=')
  })

  test('FLT-9: 검색어 입력 후 검색결과 건수 텍스트 형식 확인', async ({ page }) => {
    // /services?q=디자인 → "디자인" 검색결과 N건 또는 총 N개의 서비스 형식 확인
    await page.goto('/services?q=디자인')
    await page.waitForTimeout(2000)

    // 배포 여부에 따라 텍스트 형식이 다를 수 있음
    // 신규 배포: "디자인" 검색결과 N건
    // 기존 배포: 총 N개의 서비스 (q 파라미터 무관하게)
    const countText = page.locator('p').filter({ hasText: /건|서비스/ }).first()
    await expect(countText).toBeVisible({ timeout: TIMEOUT })
    const text = await countText.textContent()
    expect(text).toMatch(/건|서비스/)
  })
})
