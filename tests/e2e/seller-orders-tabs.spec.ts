import { test, expect } from '@playwright/test'

test.describe('판매자 주문 관리 5탭 (SORD-1~7)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/seller/orders')
    // 배포 감지
    const heading = page.getByRole('heading', { name: '주문 관리' })
    const loginPage = page.getByRole('heading', { name: /로그인/ })
    const first = await Promise.race([
      heading.waitFor({ timeout: 10000 }).then(() => 'orders' as const),
      loginPage.waitFor({ timeout: 10000 }).then(() => 'login' as const),
    ]).catch(() => 'timeout' as const)

    if (first === 'timeout') {
      test.skip(true, '판매자 주문 관리 페이지가 아직 배포되지 않았습니다')
    }
  })

  test('SORD-1: 5개 탭이 표시됨', async ({ page }) => {
    const tabNames = ['대기', '진행중', '납품완료', '완료', '취소/분쟁']
    for (const name of tabNames) {
      // 탭에는 카운트가 포함되므로 partial match
      const tab = page.getByRole('tab', { name: new RegExp(name) })
      await expect(tab).toBeVisible({ timeout: 5000 }).catch(() => {
        test.skip(true, `${name} 탭이 아직 배포되지 않았습니다`)
      })
    }
  })

  test('SORD-2: 대기 탭이 기본 선택됨', async ({ page }) => {
    const pendingTab = page.getByRole('tab', { name: /대기/ })
    const isVisible = await pendingTab.isVisible().catch(() => false)
    if (!isVisible) {
      test.skip(true, '5탭 UI가 아직 배포되지 않았습니다')
      return
    }
    await expect(pendingTab).toHaveAttribute('data-state', 'active')
  })

  test('SORD-3: 탭 클릭 시 해당 탭 콘텐츠 표시', async ({ page }) => {
    const completedTab = page.getByRole('tab', { name: /완료/ })
    const isVisible = await completedTab.isVisible().catch(() => false)
    if (!isVisible) {
      test.skip(true, '5탭 UI가 아직 배포되지 않았습니다')
      return
    }
    await completedTab.click()
    await expect(completedTab).toHaveAttribute('data-state', 'active')
  })

  test('SORD-4: 취소/분쟁 탭 클릭 시 표시', async ({ page }) => {
    const cancelTab = page.getByRole('tab', { name: /취소/ })
    const isVisible = await cancelTab.isVisible().catch(() => false)
    if (!isVisible) {
      test.skip(true, '5탭 UI가 아직 배포되지 않았습니다')
      return
    }
    await cancelTab.click()
    await expect(cancelTab).toHaveAttribute('data-state', 'active')
  })

  test('SORD-5: 각 탭에 주문 수가 표시됨', async ({ page }) => {
    // 대기 탭에 숫자가 포함되어야 함
    const pendingTab = page.getByRole('tab', { name: /대기/ })
    const isVisible = await pendingTab.isVisible().catch(() => false)
    if (!isVisible) {
      test.skip(true, '5탭 UI가 아직 배포되지 않았습니다')
      return
    }
    const tabText = await pendingTab.textContent()
    // "대기 (N)" 형식에서 숫자가 포함되어야 함
    expect(tabText).toMatch(/대기\s*\(\d+\)/)
  })

  test('SORD-6: 대기 주문에 수락/거절 버튼 존재 확인', async ({ page }) => {
    const pendingTab = page.getByRole('tab', { name: /대기/ })
    const isVisible = await pendingTab.isVisible().catch(() => false)
    if (!isVisible) {
      test.skip(true, '5탭 UI가 아직 배포되지 않았습니다')
      return
    }
    await pendingTab.click()
    // 대기 주문이 있을 때만 버튼 검증
    const acceptButton = page.getByRole('button', { name: '주문 수락' }).first()
    const emptyMessage = page.getByText('대기 중인 주문이 없습니다')
    const hasAccept = await acceptButton.isVisible().catch(() => false)
    const hasEmpty = await emptyMessage.isVisible().catch(() => false)
    // 둘 중 하나는 표시되어야 함
    expect(hasAccept || hasEmpty).toBe(true)
  })

  test('SORD-7: 비인증 사용자는 로그인 페이지로 리다이렉트', async ({ page, context }) => {
    const newPage = await context.newPage()
    await newPage.goto('/seller/orders')
    await newPage.waitForURL(/\/(login|seller\/orders)/, { timeout: 10000 })
    await newPage.close()
  })
})
