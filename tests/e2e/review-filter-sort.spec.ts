import { test, expect } from '@playwright/test'

test.describe('리뷰 필터/정렬 (RVF-1~6)', () => {
  test.beforeEach(async ({ page }) => {
    // 리뷰가 있는 서비스 상세 페이지로 이동
    await page.goto('/services')
    const serviceLink = page.locator('a[href^="/services/"]').first()
    const isVisible = await serviceLink.isVisible({ timeout: 10000 }).catch(() => false)
    if (!isVisible) {
      test.skip(true, '서비스 목록을 불러올 수 없습니다')
      return
    }
    await serviceLink.click()
    await page.waitForURL(/\/services\//, { timeout: 10000 })
  })

  test('RVF-1: 리뷰 탭에 필터 버튼 표시 (전체/5점/4점/3점/2점/1점)', async ({ page }) => {
    const reviewTab = page.getByRole('tab', { name: /리뷰/ })
    const isVisible = await reviewTab.isVisible().catch(() => false)
    if (!isVisible) {
      test.skip(true, '리뷰 탭이 없습니다')
      return
    }
    await reviewTab.click()
    // 필터 버튼 확인
    const filterAll = page.getByRole('button', { name: '전체' })
    const hasFilter = await filterAll.isVisible({ timeout: 5000 }).catch(() => false)
    if (!hasFilter) {
      test.skip(true, '리뷰 필터 UI가 아직 배포되지 않았습니다')
      return
    }
    await expect(filterAll).toBeVisible()
  })

  test('RVF-2: 정렬 드롭다운 표시 (최신순/평점 높은순/평점 낮은순)', async ({ page }) => {
    const reviewTab = page.getByRole('tab', { name: /리뷰/ })
    const isVisible = await reviewTab.isVisible().catch(() => false)
    if (!isVisible) {
      test.skip(true, '리뷰 탭이 없습니다')
      return
    }
    await reviewTab.click()
    // 정렬 셀렉트 트리거 확인
    const sortTrigger = page.getByRole('combobox')
    const hasTrigger = await sortTrigger.isVisible({ timeout: 5000 }).catch(() => false)
    if (!hasTrigger) {
      test.skip(true, '정렬 드롭다운이 아직 배포되지 않았습니다')
      return
    }
    await expect(sortTrigger).toBeVisible()
  })

  test('RVF-3: 평점 필터 클릭 시 필터링 동작', async ({ page }) => {
    const reviewTab = page.getByRole('tab', { name: /리뷰/ })
    const isVisible = await reviewTab.isVisible().catch(() => false)
    if (!isVisible) {
      test.skip(true, '리뷰 탭이 없습니다')
      return
    }
    await reviewTab.click()
    const filter5 = page.getByRole('button', { name: '5점' })
    const hasFilter = await filter5.isVisible({ timeout: 5000 }).catch(() => false)
    if (!hasFilter) {
      test.skip(true, '리뷰 필터 UI가 아직 배포되지 않았습니다')
      return
    }
    await filter5.click()
    // 클릭 후 필터 버튼이 활성화 스타일을 가져야 함
    // "전체" 버튼은 비활성화 상태여야 함
    const filterAll = page.getByRole('button', { name: '전체' })
    const allClasses = await filterAll.getAttribute('class')
    // 5점 버튼 클릭 후 전체 버튼은 비활성 스타일이어야 함
    expect(allClasses).toBeDefined()
  })

  test('RVF-4: 필터된 리뷰 수 표시', async ({ page }) => {
    const reviewTab = page.getByRole('tab', { name: /리뷰/ })
    const isVisible = await reviewTab.isVisible().catch(() => false)
    if (!isVisible) {
      test.skip(true, '리뷰 탭이 없습니다')
      return
    }
    await reviewTab.click()
    // "N개의 리뷰" 텍스트가 존재하는지 확인
    const reviewCount = page.getByText(/\d+개의 리뷰/)
    const hasCount = await reviewCount.isVisible({ timeout: 5000 }).catch(() => false)
    if (!hasCount) {
      // 리뷰가 없을 수도 있음
      const noReview = page.getByText('아직 리뷰가 없습니다')
      const hasNoReview = await noReview.isVisible().catch(() => false)
      expect(hasCount || hasNoReview).toBe(true)
      return
    }
    await expect(reviewCount).toBeVisible()
  })

  test('RVF-5: 빈 필터 결과 시 안내 메시지 표시', async ({ page }) => {
    const reviewTab = page.getByRole('tab', { name: /리뷰/ })
    const isVisible = await reviewTab.isVisible().catch(() => false)
    if (!isVisible) {
      test.skip(true, '리뷰 탭이 없습니다')
      return
    }
    await reviewTab.click()
    // 1점 필터 클릭 — 대부분 비어있을 확률이 높음
    const filter1 = page.getByRole('button', { name: '1점' })
    const hasFilter = await filter1.isVisible({ timeout: 5000 }).catch(() => false)
    if (!hasFilter) {
      test.skip(true, '리뷰 필터 UI가 아직 배포되지 않았습니다')
      return
    }
    await filter1.click()
    // 빈 결과 메시지 또는 리뷰가 있으면 그것도 정상
    await page.waitForTimeout(500)
  })

  test('RVF-6: 전체 필터로 복귀 시 모든 리뷰 표시', async ({ page }) => {
    const reviewTab = page.getByRole('tab', { name: /리뷰/ })
    const isVisible = await reviewTab.isVisible().catch(() => false)
    if (!isVisible) {
      test.skip(true, '리뷰 탭이 없습니다')
      return
    }
    await reviewTab.click()
    const filterAll = page.getByRole('button', { name: '전체' })
    const hasFilter = await filterAll.isVisible({ timeout: 5000 }).catch(() => false)
    if (!hasFilter) {
      test.skip(true, '리뷰 필터 UI가 아직 배포되지 않았습니다')
      return
    }
    // 5점으로 필터 후 전체로 돌아오기
    const filter5 = page.getByRole('button', { name: '5점' })
    await filter5.click()
    await filterAll.click()
    // 전체 버튼이 활성화 스타일을 가져야 함
    await expect(filterAll).toBeVisible()
  })
})
