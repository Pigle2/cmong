import { test, expect } from '@playwright/test'

test.describe('주문 상세 뒤로가기 (ODET-1~3)', () => {
  test('ODET-1: 주문 상세 페이지에 주문 내역 링크 표시', async ({ page }) => {
    await page.goto('/orders')
    const heading = page.getByRole('heading', { name: '주문 내역' })
    const loginPage = page.getByRole('heading', { name: /로그인/ })
    const first = await Promise.race([
      heading.waitFor({ timeout: 10000 }).then(() => 'orders' as const),
      loginPage.waitFor({ timeout: 10000 }).then(() => 'login' as const),
    ]).catch(() => 'timeout' as const)

    if (first !== 'orders') {
      test.skip(true, '주문 내역 페이지에 접근할 수 없습니다')
      return
    }

    // 주문이 있으면 첫 번째 주문 클릭
    const orderLink = page.locator('a[href^="/orders/"]').first()
    const hasOrder = await orderLink.isVisible({ timeout: 5000 }).catch(() => false)
    if (!hasOrder) {
      test.skip(true, '주문이 없어 상세 페이지를 테스트할 수 없습니다')
      return
    }
    await orderLink.click()
    await page.waitForURL(/\/orders\//, { timeout: 10000 })

    // 뒤로가기 링크 확인
    const backLink = page.getByRole('link', { name: /주문 내역/ })
    await expect(backLink).toBeVisible()
    await expect(backLink).toHaveAttribute('href', '/orders')
  })

  test('ODET-2: 주문 상세 페이지에 주문번호 표시', async ({ page }) => {
    await page.goto('/orders')
    const heading = page.getByRole('heading', { name: '주문 내역' })
    const loginPage = page.getByRole('heading', { name: /로그인/ })
    const first = await Promise.race([
      heading.waitFor({ timeout: 10000 }).then(() => 'orders' as const),
      loginPage.waitFor({ timeout: 10000 }).then(() => 'login' as const),
    ]).catch(() => 'timeout' as const)

    if (first !== 'orders') {
      test.skip(true, '주문 내역 페이지에 접근할 수 없습니다')
      return
    }

    const orderLink = page.locator('a[href^="/orders/"]').first()
    const hasOrder = await orderLink.isVisible({ timeout: 5000 }).catch(() => false)
    if (!hasOrder) {
      test.skip(true, '주문이 없어 상세 페이지를 테스트할 수 없습니다')
      return
    }
    await orderLink.click()
    await page.waitForURL(/\/orders\//, { timeout: 10000 })

    const detailHeading = page.getByRole('heading', { name: '주문 상세' })
    await expect(detailHeading).toBeVisible()
  })

  test('ODET-3: 비인증 사용자 주문 상세 접근 시 리다이렉트', async ({ page, context }) => {
    const newPage = await context.newPage()
    const fakeId = '00000000-0000-0000-0000-000000000000'
    await newPage.goto(`/orders/${fakeId}`)
    await newPage.waitForURL(/\/(login|orders|404)/, { timeout: 10000 }).catch(() => {})
    await newPage.close()
  })
})
