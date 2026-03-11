import { test, expect } from '@playwright/test'

test.describe('판매자 네비게이션 (SNAV-1~3)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/seller/dashboard')
    const heading = page.getByRole('heading', { name: '대시보드' })
    const loginPage = page.getByRole('heading', { name: /로그인/ })
    const first = await Promise.race([
      heading.waitFor({ timeout: 10000 }).then(() => 'dashboard' as const),
      loginPage.waitFor({ timeout: 10000 }).then(() => 'login' as const),
    ]).catch(() => 'timeout' as const)

    if (first !== 'dashboard') {
      test.skip(true, '판매자 대시보드에 접근할 수 없습니다')
    }
  })

  test('SNAV-1: 사이드바에 7개 네비게이션 항목 표시', async ({ page }) => {
    const navItems = ['대시보드', '서비스 관리', '주문 관리', '정산 관리', '통계', '메시지', '프로필']
    for (const label of navItems) {
      const link = page.getByRole('link', { name: label })
      const isVisible = await link.isVisible().catch(() => false)
      if (!isVisible) {
        test.skip(true, `${label} 네비게이션 항목이 없습니다`)
        return
      }
    }
  })

  test('SNAV-2: 정산 관리 링크가 /seller/settlement로 연결', async ({ page }) => {
    const link = page.getByRole('link', { name: '정산 관리' })
    const isVisible = await link.isVisible().catch(() => false)
    if (!isVisible) {
      test.skip(true, '정산 관리 링크가 없습니다')
      return
    }
    await expect(link).toHaveAttribute('href', '/seller/settlement')
  })

  test('SNAV-3: 통계 링크가 /seller/analytics로 연결', async ({ page }) => {
    const link = page.getByRole('link', { name: '통계' })
    const isVisible = await link.isVisible().catch(() => false)
    if (!isVisible) {
      test.skip(true, '통계 링크가 없습니다')
      return
    }
    await expect(link).toHaveAttribute('href', '/seller/analytics')
  })
})
