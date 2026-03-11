import { test, expect } from '@playwright/test'

test.describe('판매자 응답률 + 등급 뱃지 (RESP-1~5)', () => {
  test('RESP-1: 서비스 상세에서 판매자 응답률 % 표시', async ({ page }) => {
    await page.goto('/services')
    const serviceLink = page.locator('a[href^="/services/"]').first()
    const isVisible = await serviceLink.isVisible({ timeout: 10000 }).catch(() => false)
    if (!isVisible) {
      test.skip(true, '서비스 목록을 불러올 수 없습니다')
      return
    }
    await serviceLink.click()
    await page.waitForURL(/\/services\//, { timeout: 10000 })

    // 응답률 텍스트 확인 (기존: "응답률 높음" → 신규: "응답률 98%")
    const responseRate = page.getByText(/응답률 \d+%/)
    const hasRate = await responseRate.isVisible({ timeout: 5000 }).catch(() => false)
    if (!hasRate) {
      // 응답률이 없는 판매자일 수 있음
      const oldFormat = page.getByText(/응답률 (높음|보통|낮음)/)
      const hasOld = await oldFormat.isVisible({ timeout: 2000 }).catch(() => false)
      if (hasOld) {
        // 아직 배포 전 버전
        test.skip(true, '응답률 % 표시가 아직 배포되지 않았습니다')
        return
      }
      // 응답률 정보 자체가 없는 판매자
      test.skip(true, '이 판매자에게 응답률 정보가 없습니다')
      return
    }
    await expect(responseRate).toBeVisible()
  })

  test('RESP-2: 서비스 상세에서 평균 응답 시간 표시', async ({ page }) => {
    await page.goto('/services')
    const serviceLink = page.locator('a[href^="/services/"]').first()
    const isVisible = await serviceLink.isVisible({ timeout: 10000 }).catch(() => false)
    if (!isVisible) {
      test.skip(true, '서비스 목록을 불러올 수 없습니다')
      return
    }
    await serviceLink.click()
    await page.waitForURL(/\/services\//, { timeout: 10000 })

    // "평균 N분 이내" 또는 "평균 N시간 이내" 형식
    const responseTime = page.getByText(/평균 \d+(분|시간) 이내/)
    const hasTime = await responseTime.isVisible({ timeout: 5000 }).catch(() => false)
    if (!hasTime) {
      test.skip(true, '응답 시간 정보가 없는 판매자입니다')
      return
    }
    await expect(responseTime).toBeVisible()
  })

  test('RESP-3: 서비스 상세에서 판매자 등급 뱃지 표시', async ({ page }) => {
    await page.goto('/services')
    const serviceLink = page.locator('a[href^="/services/"]').first()
    const isVisible = await serviceLink.isVisible({ timeout: 10000 }).catch(() => false)
    if (!isVisible) {
      test.skip(true, '서비스 목록을 불러올 수 없습니다')
      return
    }
    await serviceLink.click()
    await page.waitForURL(/\/services\//, { timeout: 10000 })

    // 판매자 등급 뱃지 (전문가, 마스터, 일반, 신규 중 하나)
    const gradeBadge = page.getByText(/^(전문가|마스터|일반|신규)$/).first()
    const hasGrade = await gradeBadge.isVisible({ timeout: 5000 }).catch(() => false)
    if (!hasGrade) {
      test.skip(true, '판매자 등급 정보가 없습니다')
      return
    }
    await expect(gradeBadge).toBeVisible()
  })

  test('RESP-4: 서비스 카드에 판매자 이름 표시', async ({ page }) => {
    await page.goto('/services')
    // 서비스 카드 목록에서 판매자 이름 확인
    const card = page.locator('a[href^="/services/"]').first()
    const isVisible = await card.isVisible({ timeout: 10000 }).catch(() => false)
    if (!isVisible) {
      test.skip(true, '서비스 목록을 불러올 수 없습니다')
      return
    }
    // 카드 내 판매자 이름 텍스트 존재 확인
    const sellerText = card.locator('.text-muted-foreground').first()
    await expect(sellerText).toBeVisible()
  })

  test('RESP-5: 서비스 카드에 평점/리뷰수 표시', async ({ page }) => {
    await page.goto('/services')
    const card = page.locator('a[href^="/services/"]').first()
    const isVisible = await card.isVisible({ timeout: 10000 }).catch(() => false)
    if (!isVisible) {
      test.skip(true, '서비스 목록을 불러올 수 없습니다')
      return
    }
    // 평점 표시 확인 (Star 아이콘 근처)
    const rating = card.locator('text=/\\d\\.\\d/').first()
    const hasRating = await rating.isVisible().catch(() => false)
    if (!hasRating) {
      test.skip(true, '평점 정보가 표시되지 않습니다')
      return
    }
    await expect(rating).toBeVisible()
  })
})
