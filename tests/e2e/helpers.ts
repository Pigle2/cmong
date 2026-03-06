import { expect, type Page } from '@playwright/test'

export const BUYER = { email: 'buyer1@test.com', password: 'Test1234!' }
export const SELLER = { email: 'seller1@test.com', password: 'Test1234!' }
export const TIMEOUT = 15000

export async function login(page: Page, account: typeof BUYER) {
  await page.goto('/login')
  await page.fill('input[type="email"]', account.email)
  await page.fill('input[type="password"]', account.password)
  await page.click('button[type="submit"]')
  await expect(page).not.toHaveURL(/login/, { timeout: TIMEOUT })
}

export async function logout(page: Page) {
  // 실제 UI를 통한 로그아웃: 아바타 클릭 → "로그아웃" 클릭
  const avatar = page.locator('header').locator('button:has(span.relative), [role="img"]').first()
  await expect(avatar).toBeVisible({ timeout: TIMEOUT })
  await avatar.click()
  await page.waitForTimeout(500)
  const logoutBtn = page.getByText('로그아웃')
  await expect(logoutBtn).toBeVisible({ timeout: 5000 })
  await logoutBtn.click()
  // handleLogout이 window.location.href = '/' 로 풀 페이지 리로드 수행
  await page.waitForLoadState('load', { timeout: TIMEOUT })
  await page.waitForTimeout(1000)
}
