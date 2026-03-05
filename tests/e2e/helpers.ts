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
  await page.evaluate(async () => {
    for (const key of Object.keys(localStorage)) {
      if (key.includes('supabase') || key.includes('sb-')) {
        localStorage.removeItem(key)
      }
    }
    document.cookie.split(';').forEach(c => {
      const name = c.trim().split('=')[0]
      if (name.includes('sb-') || name.includes('supabase')) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
      }
    })
  }).catch(() => {})
  await page.waitForTimeout(1000)
}
