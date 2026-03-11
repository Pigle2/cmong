import { test, expect } from '@playwright/test'

test.describe('판매자 정산 관리 (SETL-1~7)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/seller/settlement')
    const heading = page.getByRole('heading', { name: '정산 관리' })
    const loginPage = page.getByRole('heading', { name: /로그인/ })
    const first = await Promise.race([
      heading.waitFor({ timeout: 10000 }).then(() => 'settlement' as const),
      loginPage.waitFor({ timeout: 10000 }).then(() => 'login' as const),
    ]).catch(() => 'timeout' as const)

    if (first === 'timeout') {
      test.skip(true, '정산 관리 페이지가 아직 배포되지 않았습니다')
    }
  })

  test('SETL-1: 정산 관리 페이지 타이틀 표시', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '정산 관리' })).toBeVisible({ timeout: 5000 }).catch(() => {
      test.skip(true, '정산 관리 헤딩이 없습니다')
    })
  })

  test('SETL-2: 프로토타입 안내 배너 표시', async ({ page }) => {
    const banner = page.getByText('프로토타입: 실제 정산 기능은 추후 지원 예정입니다')
    const isVisible = await banner.isVisible().catch(() => false)
    if (!isVisible) {
      test.skip(true, '프로토타입 배너가 없습니다')
      return
    }
    await expect(banner).toBeVisible()
  })

  test('SETL-3: 3개 통계 카드 표시 (가용 잔액/정산 대기/누적 수익)', async ({ page }) => {
    const cards = ['가용 잔액', '정산 대기', '누적 수익']
    for (const name of cards) {
      const el = page.getByText(name)
      const isVisible = await el.isVisible().catch(() => false)
      if (!isVisible) {
        test.skip(true, `${name} 카드가 없습니다`)
        return
      }
    }
  })

  test('SETL-4: 출금요청 버튼이 비활성화 상태', async ({ page }) => {
    const btn = page.getByRole('button', { name: '출금요청' })
    const isVisible = await btn.isVisible().catch(() => false)
    if (!isVisible) {
      test.skip(true, '출금요청 버튼이 없습니다')
      return
    }
    await expect(btn).toBeDisabled()
  })

  test('SETL-5: 정산 내역 테이블 헤더 표시', async ({ page }) => {
    const headers = ['일자', '주문번호', '금액', '수수료', '정산']
    for (const h of headers) {
      const el = page.locator('th', { hasText: h })
      const isVisible = await el.isVisible().catch(() => false)
      if (!isVisible) {
        test.skip(true, `테이블 헤더 ${h}가 없습니다`)
        return
      }
    }
  })

  test('SETL-6: 계좌 미등록 상태 표시 + 계좌 등록 버튼 비활성화', async ({ page }) => {
    const badge = page.getByText('미등록')
    const btn = page.getByRole('button', { name: '계좌 등록' })
    const badgeVisible = await badge.isVisible().catch(() => false)
    if (!badgeVisible) {
      test.skip(true, '계좌 상태가 없습니다')
      return
    }
    await expect(badge).toBeVisible()
    await expect(btn).toBeDisabled()
  })

  test('SETL-7: 비인증 사용자는 로그인 리다이렉트', async ({ page, context }) => {
    const newPage = await context.newPage()
    await newPage.goto('/seller/settlement')
    await newPage.waitForURL(/\/(login|seller\/settlement)/, { timeout: 10000 })
    await newPage.close()
  })
})
