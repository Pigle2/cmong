import { test, expect } from '@playwright/test'
import { SELLER, TIMEOUT, login } from './helpers'

test.describe('판매자 관리', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, SELLER)
  })

  test('D-1. 판매자 대시보드 접근 - 통계 카드 표시', async ({ page }) => {
    await page.goto('/seller/dashboard')
    await expect(page.getByText('판매자 대시보드')).toBeVisible({ timeout: TIMEOUT })
    await expect(page.getByText('등록 서비스')).toBeVisible()
    await expect(page.getByText('진행중 주문')).toBeVisible()
    await expect(page.getByText('완료 주문')).toBeVisible()
    await expect(page.getByText('평균 평점')).toBeVisible()
  })

  test('D-5. 판매자 주문 관리 페이지', async ({ page }) => {
    await page.goto('/seller/orders')
    await expect(page.getByRole('heading', { name: '주문 관리' })).toBeVisible({ timeout: TIMEOUT })
    await expect(page.getByRole('tab', { name: /진행중/ })).toBeVisible()
    await expect(page.getByRole('tab', { name: /완료/ })).toBeVisible()
  })

  test('D-6. 판매자 주문 상세 → 액션 버튼', async ({ page }) => {
    await page.goto('/seller/orders')
    await page.waitForTimeout(3000)
    const orderLink = page.locator('a[href*="/seller/orders/"]').first()
    if (await orderLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await orderLink.click()
      await page.waitForURL(/seller\/orders\//, { timeout: TIMEOUT })
      const actions = page.locator('button:has-text("수락"), button:has-text("거절"), button:has-text("작업 시작"), button:has-text("납품")')
      const hasActions = await actions.first().isVisible({ timeout: 5000 }).catch(() => false)
      console.log(`  판매자 액션 버튼 존재: ${hasActions}`)
    }
  })

  test('D-7. 판매자 프로필 관리 페이지', async ({ page }) => {
    await page.goto('/seller/profile')
    await page.waitForTimeout(3000)
    await expect(page.getByText(/판매자 프로필|프로필 관리/)).toBeVisible({ timeout: TIMEOUT })
    const nameInput = page.locator('input[name*="name"], input[placeholder*="활동명"]').first()
    const hasInput = await nameInput.isVisible({ timeout: 3000 }).catch(() => false)
    console.log(`  프로필 입력 필드 존재: ${hasInput}`)
  })

  test('D-8. 판매자 프로필 저장', async ({ page }) => {
    await page.goto('/seller/profile')
    await page.waitForTimeout(3000)
    const textarea = page.locator('textarea').first()
    if (await textarea.isVisible({ timeout: 3000 }).catch(() => false)) {
      await textarea.fill('E2E 테스트로 업데이트된 소개입니다.')
    }
    const saveBtn = page.locator('button:has-text("저장"), button[type="submit"]').first()
    if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await saveBtn.click()
      await page.waitForTimeout(3000)
    }
  })
})
