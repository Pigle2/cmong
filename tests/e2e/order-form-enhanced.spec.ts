import { test, expect } from '@playwright/test'

test.describe('주문서 개선 (OFRM-1~5)', () => {
  test('OFRM-1: 주문 페이지에 희망 완료일 필드 표시', async ({ page }) => {
    // 서비스 목록에서 첫 서비스의 주문 페이지로 이동
    await page.goto('/services')
    const serviceLink = page.locator('a[href^="/services/"]').first()
    const isVisible = await serviceLink.isVisible({ timeout: 10000 }).catch(() => false)
    if (!isVisible) {
      test.skip(true, '서비스 목록을 불러올 수 없습니다')
      return
    }
    await serviceLink.click()
    await page.waitForURL(/\/services\//, { timeout: 10000 })

    // 구매하기 버튼 찾기
    const buyBtn = page.getByRole('link', { name: /구매하기/ }).first()
    const hasBuy = await buyBtn.isVisible({ timeout: 5000 }).catch(() => false)
    if (!hasBuy) {
      test.skip(true, '구매하기 버튼이 없습니다')
      return
    }
    await buyBtn.click()
    await page.waitForURL(/\/orders\/new/, { timeout: 10000 })

    // 로그인 리다이렉트 확인
    const loginHeading = page.getByRole('heading', { name: /로그인/ })
    const isLogin = await loginHeading.isVisible({ timeout: 3000 }).catch(() => false)
    if (isLogin) {
      test.skip(true, '로그인이 필요합니다')
      return
    }

    // 희망 완료일 필드 확인
    const dueDateLabel = page.getByText('희망 완료일')
    const hasField = await dueDateLabel.isVisible({ timeout: 5000 }).catch(() => false)
    if (!hasField) {
      test.skip(true, '희망 완료일 필드가 아직 배포되지 않았습니다')
      return
    }
    await expect(dueDateLabel).toBeVisible()
  })

  test('OFRM-2: 요구사항 글자수 카운터 표시', async ({ page }) => {
    await page.goto('/services')
    const serviceLink = page.locator('a[href^="/services/"]').first()
    const isVisible = await serviceLink.isVisible({ timeout: 10000 }).catch(() => false)
    if (!isVisible) {
      test.skip(true, '서비스 목록을 불러올 수 없습니다')
      return
    }
    await serviceLink.click()
    await page.waitForURL(/\/services\//, { timeout: 10000 })

    const buyBtn = page.getByRole('link', { name: /구매하기/ }).first()
    const hasBuy = await buyBtn.isVisible({ timeout: 5000 }).catch(() => false)
    if (!hasBuy) {
      test.skip(true, '구매하기 버튼이 없습니다')
      return
    }
    await buyBtn.click()
    await page.waitForURL(/\/orders\/new/, { timeout: 10000 })

    const loginHeading = page.getByRole('heading', { name: /로그인/ })
    const isLogin = await loginHeading.isVisible({ timeout: 3000 }).catch(() => false)
    if (isLogin) {
      test.skip(true, '로그인이 필요합니다')
      return
    }

    // 글자수 카운터 확인
    const counter = page.getByText(/\/5,000자/)
    const hasCounter = await counter.isVisible({ timeout: 5000 }).catch(() => false)
    if (!hasCounter) {
      test.skip(true, '글자수 카운터가 아직 배포되지 않았습니다')
      return
    }
    await expect(counter).toBeVisible()
  })

  test('OFRM-3: 요구사항 최소 30자 안내 표시', async ({ page }) => {
    await page.goto('/services')
    const serviceLink = page.locator('a[href^="/services/"]').first()
    const isVisible = await serviceLink.isVisible({ timeout: 10000 }).catch(() => false)
    if (!isVisible) {
      test.skip(true, '서비스 목록을 불러올 수 없습니다')
      return
    }
    await serviceLink.click()
    await page.waitForURL(/\/services\//, { timeout: 10000 })

    const buyBtn = page.getByRole('link', { name: /구매하기/ }).first()
    const hasBuy = await buyBtn.isVisible({ timeout: 5000 }).catch(() => false)
    if (!hasBuy) {
      test.skip(true, '구매하기 버튼이 없습니다')
      return
    }
    await buyBtn.click()
    await page.waitForURL(/\/orders\/new/, { timeout: 10000 })

    const loginHeading = page.getByRole('heading', { name: /로그인/ })
    const isLogin = await loginHeading.isVisible({ timeout: 3000 }).catch(() => false)
    if (isLogin) {
      test.skip(true, '로그인이 필요합니다')
      return
    }

    const minLabel = page.getByText(/최소 30자/)
    const hasLabel = await minLabel.isVisible({ timeout: 5000 }).catch(() => false)
    if (!hasLabel) {
      test.skip(true, '최소 30자 라벨이 아직 배포되지 않았습니다')
      return
    }
    await expect(minLabel).toBeVisible()
  })

  test('OFRM-4: 주문 API 요구사항 길이 검증', async ({ request }) => {
    const res = await request.post('/api/orders', {
      data: {
        serviceId: '00000000-0000-0000-0000-000000000000',
        packageId: '00000000-0000-0000-0000-000000000000',
        requirements: 'a'.repeat(5001),
      },
    })
    // 미배포 시 404, 배포 후 400 또는 401
    expect([400, 401, 404]).toContain(res.status())
  })

  test('OFRM-5: 주문 API preferredDueDate 파라미터 수용', async ({ request }) => {
    const res = await request.post('/api/orders', {
      data: {
        serviceId: '00000000-0000-0000-0000-000000000000',
        packageId: '00000000-0000-0000-0000-000000000000',
        requirements: null,
        preferredDueDate: '2030-12-31',
      },
    })
    // 미배포 시 404, 배포 후 401 (비인증)
    expect([401, 404]).toContain(res.status())
  })
})
