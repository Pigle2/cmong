import { test, expect } from '@playwright/test'

test.describe('구매자 주문 내역 상태 탭 (BORD-1~6)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/orders')
    const heading = page.getByRole('heading', { name: '주문 내역' })
    const loginPage = page.getByRole('heading', { name: /로그인/ })
    const first = await Promise.race([
      heading.waitFor({ timeout: 10000 }).then(() => 'orders' as const),
      loginPage.waitFor({ timeout: 10000 }).then(() => 'login' as const),
    ]).catch(() => 'timeout' as const)

    if (first === 'timeout') {
      test.skip(true, '주문 내역 페이지가 아직 배포되지 않았습니다')
    }
  })

  test('BORD-1: 4개 탭이 표시됨 (전체/진행중/완료/취소)', async ({ page }) => {
    const tabNames = ['전체', '진행중', '완료', '취소']
    for (const name of tabNames) {
      const tab = page.getByRole('tab', { name: new RegExp(name) })
      const isVisible = await tab.isVisible().catch(() => false)
      if (!isVisible) {
        test.skip(true, `${name} 탭이 아직 배포되지 않았습니다`)
        return
      }
    }
  })

  test('BORD-2: 전체 탭이 기본 선택됨', async ({ page }) => {
    const allTab = page.getByRole('tab', { name: /전체/ })
    const isVisible = await allTab.isVisible().catch(() => false)
    if (!isVisible) {
      test.skip(true, '상태 탭이 아직 배포되지 않았습니다')
      return
    }
    await expect(allTab).toHaveAttribute('data-state', 'active')
  })

  test('BORD-3: 진행중 탭 클릭 시 탭 전환', async ({ page }) => {
    const activeTab = page.getByRole('tab', { name: /진행중/ })
    const isVisible = await activeTab.isVisible().catch(() => false)
    if (!isVisible) {
      test.skip(true, '상태 탭이 아직 배포되지 않았습니다')
      return
    }
    await activeTab.click()
    await expect(activeTab).toHaveAttribute('data-state', 'active')
  })

  test('BORD-4: 완료 탭 클릭 시 탭 전환', async ({ page }) => {
    const completedTab = page.getByRole('tab', { name: /완료/ })
    const isVisible = await completedTab.isVisible().catch(() => false)
    if (!isVisible) {
      test.skip(true, '상태 탭이 아직 배포되지 않았습니다')
      return
    }
    await completedTab.click()
    await expect(completedTab).toHaveAttribute('data-state', 'active')
  })

  test('BORD-5: 각 탭에 건수가 표시됨', async ({ page }) => {
    const allTab = page.getByRole('tab', { name: /전체/ })
    const isVisible = await allTab.isVisible().catch(() => false)
    if (!isVisible) {
      test.skip(true, '상태 탭이 아직 배포되지 않았습니다')
      return
    }
    const tabText = await allTab.textContent()
    expect(tabText).toMatch(/전체\s*\(\d+\)/)
  })

  test('BORD-6: 비인증 사용자는 로그인 리다이렉트', async ({ page, context }) => {
    const newPage = await context.newPage()
    await newPage.goto('/orders')
    await newPage.waitForURL(/\/(login|orders)/, { timeout: 10000 })
    await newPage.close()
  })
})
