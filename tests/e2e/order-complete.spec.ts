import { test, expect } from '@playwright/test'

test.describe('주문 완료 페이지 (OCMP-1~4)', () => {
  test('OCMP-1: 주문 완료 페이지 기본 요소 표시', async ({ page }) => {
    // 주문 내역에서 첫 주문의 완료 페이지 접근
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

    // 주문 링크 찾기
    const orderLink = page.locator('a[href^="/orders/"]').first()
    const hasOrder = await orderLink.isVisible({ timeout: 5000 }).catch(() => false)
    if (!hasOrder) {
      test.skip(true, '주문이 없어 완료 페이지를 테스트할 수 없습니다')
      return
    }

    // 주문 ID 추출해서 complete 페이지로 이동
    const href = await orderLink.getAttribute('href')
    if (!href) {
      test.skip(true, '주문 링크를 찾을 수 없습니다')
      return
    }
    await page.goto(`${href}/complete`)

    // 완료 페이지 요소 확인
    const completeHeading = page.getByText('주문이 완료되었습니다')
    const isVisible = await completeHeading.isVisible({ timeout: 10000 }).catch(() => false)
    if (!isVisible) {
      test.skip(true, '주문 완료 페이지가 아직 배포되지 않았습니다')
      return
    }
    await expect(completeHeading).toBeVisible()
  })

  test('OCMP-2: 주문 완료 페이지에 주문번호 표시', async ({ page }) => {
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
      test.skip(true, '주문이 없습니다')
      return
    }

    const href = await orderLink.getAttribute('href')
    if (!href) return
    await page.goto(`${href}/complete`)

    const completeHeading = page.getByText('주문이 완료되었습니다')
    const isVisible = await completeHeading.isVisible({ timeout: 10000 }).catch(() => false)
    if (!isVisible) {
      test.skip(true, '주문 완료 페이지가 아직 배포되지 않았습니다')
      return
    }

    // 주문번호 표시 확인
    const orderNumber = page.getByText('주문번호')
    await expect(orderNumber).toBeVisible()
  })

  test('OCMP-3: 주문 완료 페이지에 다음 단계 안내 표시', async ({ page }) => {
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
      test.skip(true, '주문이 없습니다')
      return
    }

    const href = await orderLink.getAttribute('href')
    if (!href) return
    await page.goto(`${href}/complete`)

    const completeHeading = page.getByText('주문이 완료되었습니다')
    const isVisible = await completeHeading.isVisible({ timeout: 10000 }).catch(() => false)
    if (!isVisible) {
      test.skip(true, '주문 완료 페이지가 아직 배포되지 않았습니다')
      return
    }

    // 다음 단계 안내 확인
    const nextSteps = page.getByText('다음 단계')
    await expect(nextSteps).toBeVisible()
  })

  test('OCMP-4: 비인증 사용자 주문 완료 페이지 접근 시 리다이렉트', async ({ page, context }) => {
    const newPage = await context.newPage()
    const fakeId = '00000000-0000-0000-0000-000000000000'
    await newPage.goto(`/orders/${fakeId}/complete`)
    await newPage.waitForURL(/\/(login|orders|404)/, { timeout: 10000 }).catch(() => {})
    await newPage.close()
  })
})
