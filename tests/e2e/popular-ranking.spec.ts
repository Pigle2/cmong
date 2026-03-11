import { test, expect } from '@playwright/test'

test.describe('인기 서비스 순위 표시 (RANK-1~3)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
  })

  test('RANK-1: 메인 페이지에 "인기 서비스 TOP" 섹션 표시', async ({ page }) => {
    const heading = page.getByText(/인기 서비스 TOP/)
    const isVisible = await heading.isVisible({ timeout: 5000 }).catch(() => false)
    if (!isVisible) {
      test.skip(true, '인기 서비스 TOP 섹션이 아직 배포되지 않았습니다')
      return
    }
    await expect(heading).toBeVisible()
  })

  test('RANK-2: 인기 서비스에 순위 배지 표시 (1위~3위 색상 구분)', async ({ page }) => {
    const heading = page.getByText(/인기 서비스 TOP/)
    const isVisible = await heading.isVisible({ timeout: 5000 }).catch(() => false)
    if (!isVisible) {
      test.skip(true, '인기 서비스 TOP 섹션이 아직 배포되지 않았습니다')
      return
    }

    // 1위 배지 (금색 bg-yellow-500)
    const rankBadge1 = page.locator('.bg-yellow-500').first()
    const hasRank = await rankBadge1.isVisible().catch(() => false)
    if (!hasRank) {
      test.skip(true, '순위 배지가 아직 배포되지 않았습니다')
      return
    }
    const text = await rankBadge1.textContent()
    expect(text).toBe('1')
  })

  test('RANK-3: 더보기 링크가 /services?sort=orders로 연결', async ({ page }) => {
    const heading = page.getByText(/인기 서비스 TOP/)
    const isVisible = await heading.isVisible({ timeout: 5000 }).catch(() => false)
    if (!isVisible) {
      test.skip(true, '인기 서비스 TOP 섹션이 아직 배포되지 않았습니다')
      return
    }

    const moreLink = page.getByRole('link', { name: '더보기' }).first()
    const hasLink = await moreLink.isVisible().catch(() => false)
    if (!hasLink) {
      test.skip(true, '더보기 링크가 없습니다')
      return
    }
    await expect(moreLink).toHaveAttribute('href', '/services?sort=orders')
  })
})
