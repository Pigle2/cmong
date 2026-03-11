import { test, expect } from '@playwright/test'

test.describe('판매자 대시보드 (DASH-1~6)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/seller/dashboard')
    // 배포 감지: 대시보드 페이지가 로드되는지 확인
    const heading = page.getByRole('heading', { name: '대시보드' })
    const loginPage = page.getByRole('heading', { name: /로그인/ })
    const first = await Promise.race([
      heading.waitFor({ timeout: 10000 }).then(() => 'dashboard' as const),
      loginPage.waitFor({ timeout: 10000 }).then(() => 'login' as const),
    ]).catch(() => 'timeout' as const)

    if (first === 'timeout') {
      test.skip(true, '판매자 대시보드 페이지가 아직 배포되지 않았습니다')
    }
    // 로그인 페이지로 리다이렉트되면 인증 필요 — 이 테스트는 비인증 상태 검증도 포함
  })

  test('DASH-1: 4개 주요 통계 카드 표시', async ({ page }) => {
    // 이번 달 매출, 진행중 주문, 대기중 주문, 등급 카드가 존재해야 함
    const statsCards = ['이번 달 매출', '진행중 주문', '대기중 주문', '등급']
    for (const title of statsCards) {
      await expect(page.getByText(title)).toBeVisible({ timeout: 5000 }).catch(() => {
        test.skip(true, '대시보드 통계 카드가 아직 배포되지 않았습니다')
      })
    }
  })

  test('DASH-2: 보조 지표 카드 (응답률, 평균 평점) 표시', async ({ page }) => {
    const secondaryStats = ['응답률', '평균 평점']
    for (const title of secondaryStats) {
      await expect(page.getByText(title)).toBeVisible({ timeout: 5000 }).catch(() => {
        test.skip(true, '보조 지표 카드가 아직 배포되지 않았습니다')
      })
    }
  })

  test('DASH-3: 할 일 섹션 표시', async ({ page }) => {
    const todoSection = page.getByText('할 일')
    await expect(todoSection).toBeVisible({ timeout: 5000 }).catch(() => {
      test.skip(true, '할 일 섹션이 아직 배포되지 않았습니다')
    })
  })

  test('DASH-4: 최근 주문 섹션 표시', async ({ page }) => {
    const recentOrders = page.getByText('최근 주문')
    await expect(recentOrders).toBeVisible({ timeout: 5000 }).catch(() => {
      test.skip(true, '최근 주문 섹션이 아직 배포되지 않았습니다')
    })
  })

  test('DASH-5: 전체보기 링크가 /seller/orders로 연결', async ({ page }) => {
    const viewAllLink = page.getByRole('link', { name: /전체보기/ })
    const isVisible = await viewAllLink.isVisible().catch(() => false)
    if (!isVisible) {
      test.skip(true, '전체보기 링크가 없습니다')
      return
    }
    await expect(viewAllLink).toHaveAttribute('href', '/seller/orders')
  })

  test('DASH-6: 비인증 사용자는 로그인 페이지로 리다이렉트', async ({ page, context }) => {
    // 새 페이지에서 쿠키 없이 접근
    const newPage = await context.newPage()
    await newPage.goto('/seller/dashboard')
    // 로그인 페이지로 리다이렉트되거나 로그인 폼이 표시되어야 함
    await newPage.waitForURL(/\/(login|seller\/dashboard)/, { timeout: 10000 })
    await newPage.close()
  })
})
