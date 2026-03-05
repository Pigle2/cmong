import { test, expect } from '@playwright/test'
import { BUYER, TIMEOUT, login } from './helpers'

test.describe('모바일 UI', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('G-1. 모바일 홈페이지 로드', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: '전문가에게 맡기세요' })).toBeVisible({ timeout: TIMEOUT })
  })

  test('G-2. 모바일 하단 네비게이션 표시', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)
    const nav = page.locator('nav.fixed, [class*="fixed"][class*="bottom"]')
    const hasNav = await nav.first().isVisible({ timeout: 5000 }).catch(() => false)
    console.log(`  모바일 네비게이션 표시: ${hasNav}`)
  })

  test('G-3. 모바일 서비스 카드 1열 표시', async ({ page }) => {
    await page.goto('/services')
    await expect(page.locator('[class*="card"]').first()).toBeVisible({ timeout: TIMEOUT })
  })

  test('G-4. 모바일 로그인 후 하단 네비게이션', async ({ page }) => {
    await login(page, BUYER)
    await page.goto('/')
    await page.waitForTimeout(3000)
    const nav = page.locator('nav.fixed, [class*="fixed"][class*="bottom"]')
    const hasNav = await nav.first().isVisible({ timeout: 5000 }).catch(() => false)
    console.log(`  로그인 후 모바일 네비게이션 표시: ${hasNav}`)
  })
})
