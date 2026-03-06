import { test, expect } from '@playwright/test'
import { TIMEOUT } from './helpers'

test.describe('에러 케이스', () => {
  test('H-1. 존재하지 않는 서비스 → 404', async ({ page }) => {
    await page.goto('/services/00000000-0000-0000-0000-000000000000')
    await page.waitForTimeout(3000)
    await expect(page.getByText(/찾을 수 없|404|not found/i)).toBeVisible({ timeout: 5000 })
  })

  test('H-2. 존재하지 않는 페이지 → 404', async ({ page }) => {
    await page.goto('/this-page-does-not-exist')
    await page.waitForTimeout(3000)
    await expect(page.getByText(/찾을 수 없|404|not found/i)).toBeVisible({ timeout: 5000 })
  })

  test('H-3. 빈 검색 결과', async ({ page }) => {
    await page.goto('/services?q=zzzzxxxxxxxnoexist')
    await page.waitForTimeout(3000)
    await expect(page.getByText(/검색 결과가 없습니다/)).toBeVisible({ timeout: TIMEOUT })
  })
})
