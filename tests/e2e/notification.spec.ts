import { test, expect } from '@playwright/test'
import { BUYER, SELLER, TIMEOUT, login } from './helpers'

test.describe('알림', () => {
  test('B-10. 알림 벨 아이콘 표시', async ({ page }) => {
    await login(page, BUYER)
    await page.goto('/')
    await page.waitForTimeout(3000)
    const bell = page.locator('header').locator('svg.lucide-bell, button:has(svg.lucide-bell)')
    await expect(bell.first()).toBeVisible({ timeout: 5000 })
    await bell.first().click()
    await page.waitForTimeout(2000)
  })

  test('K-1. API: 알림 목록 조회', async ({ page }) => {
    await login(page, BUYER)
    const res = await page.request.get('/api/notifications')
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data)).toBe(true)
    console.log(`  알림 수: ${body.data.length}`)
    if (body.data.length > 0) {
      const notif = body.data[0]
      expect(notif.id).toBeTruthy()
      expect(notif.type).toBeTruthy()
      expect(notif.title).toBeTruthy()
    }
  })

  test('K-2. API: 전체 알림 읽음 처리', async ({ page }) => {
    await login(page, BUYER)
    const res = await page.request.post('/api/notifications/read-all')
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.success).toBe(true)
    const checkRes = await page.request.get('/api/notifications')
    const checkBody = await checkRes.json()
    if (checkBody.data?.length > 0) {
      const unread = checkBody.data.filter((n: any) => !n.is_read)
      expect(unread.length).toBe(0)
    }
  })

  test('K-3. 헤더 알림 벨 클릭 → 알림 목록 표시', async ({ page }) => {
    await login(page, BUYER)
    await page.goto('/')
    await page.waitForTimeout(3000)
    const bell = page.locator('header button:has(svg.lucide-bell)')
    await expect(bell.first()).toBeVisible({ timeout: 5000 })
    await bell.first().click()
    await page.waitForTimeout(2000)
    const notifPanel = page.locator('[data-radix-popper-content-wrapper], [role="dialog"], [role="menu"], [class*="popover"]')
    await expect(notifPanel.first()).toBeVisible({ timeout: 5000 })
  })

  test('K-4. 판매자에게도 알림 존재', async ({ page }) => {
    await login(page, SELLER)
    const res = await page.request.get('/api/notifications')
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.success).toBe(true)
    console.log(`  판매자 알림 수: ${body.data.length}`)
  })
})
