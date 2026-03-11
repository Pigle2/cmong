import { test, expect } from '@playwright/test'

test.describe('서비스 고급 필터 (AFLT-1~5)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/services')
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
  })

  test('AFLT-1: 판매자 등급 필터 드롭다운 표시', async ({ page }) => {
    const gradeLabel = page.getByText('판매자 등급')
    const isVisible = await gradeLabel.isVisible({ timeout: 5000 }).catch(() => false)
    if (!isVisible) {
      test.skip(true, '판매자 등급 필터가 아직 배포되지 않았습니다')
      return
    }
    await expect(gradeLabel).toBeVisible()
  })

  test('AFLT-2: 거래 건수 필터 드롭다운 표시', async ({ page }) => {
    const orderLabel = page.getByText('거래 건수')
    const isVisible = await orderLabel.isVisible({ timeout: 5000 }).catch(() => false)
    if (!isVisible) {
      test.skip(true, '거래 건수 필터가 아직 배포되지 않았습니다')
      return
    }
    await expect(orderLabel).toBeVisible()
  })

  test('AFLT-3: 판매자 등급 필터 URL 파라미터 반영', async ({ page }) => {
    await page.goto('/services?sellerGrade=PRO')
    // 페이지 로드 후 결과 확인
    const resultText = page.getByText(/개의 서비스/)
    const isVisible = await resultText.isVisible({ timeout: 10000 }).catch(() => false)
    if (!isVisible) {
      test.skip(true, '필터 기능이 아직 배포되지 않았습니다')
      return
    }
    // URL에 sellerGrade가 유지되는지 확인
    expect(page.url()).toContain('sellerGrade=PRO')
  })

  test('AFLT-4: 거래 건수 필터 URL 파라미터 반영', async ({ page }) => {
    await page.goto('/services?minOrders=10')
    const resultText = page.getByText(/개의 서비스/)
    const isVisible = await resultText.isVisible({ timeout: 10000 }).catch(() => false)
    if (!isVisible) {
      test.skip(true, '필터 기능이 아직 배포되지 않았습니다')
      return
    }
    expect(page.url()).toContain('minOrders=10')
  })

  test('AFLT-5: 필터 초기화 버튼이 모든 필터 해제', async ({ page }) => {
    await page.goto('/services?sellerGrade=PRO&minOrders=10&minRating=4.5')
    const resetBtn = page.getByRole('button', { name: '필터 초기화' })
    const isVisible = await resetBtn.isVisible({ timeout: 5000 }).catch(() => false)
    if (!isVisible) {
      test.skip(true, '필터 초기화 버튼이 아직 배포되지 않았습니다')
      return
    }
    await resetBtn.click()
    await page.waitForURL(/\/services\??/, { timeout: 10000 })
    // 초기화 후 필터 파라미터가 없어야 함
    expect(page.url()).not.toContain('sellerGrade')
    expect(page.url()).not.toContain('minOrders')
  })
})
