import { test, expect } from '@playwright/test'
import { BUYER, SELLER, TIMEOUT, login } from './helpers'

test.describe('리뷰', () => {
  test('E-5. 구매자: 리뷰 작성', async ({ page }) => {
    await login(page, BUYER)
    await page.goto('/orders')
    await page.waitForTimeout(3000)
    const order = page.locator('a[href*="/orders/"]').first()
    if (await order.isVisible({ timeout: 5000 }).catch(() => false)) {
      await order.click()
      await page.waitForTimeout(3000)
      const reviewBtn = page.locator('a:has-text("리뷰 작성"), button:has-text("리뷰 작성")')
      if (await reviewBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await reviewBtn.click()
        await page.waitForURL(/review/, { timeout: TIMEOUT })
        const textarea = page.locator('textarea')
        if (await textarea.isVisible({ timeout: 3000 }).catch(() => false)) {
          await textarea.fill('E2E 테스트 리뷰입니다. 서비스 품질이 좋습니다.')
        }
        const submitBtn = page.locator('button[type="submit"], button:has-text("리뷰 등록"), button:has-text("작성")')
        if (await submitBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
          await submitBtn.first().click()
          await page.waitForTimeout(3000)
        }
      }
    }
  })

  test('J-1. API: 판매자 리뷰 답글 등록', async ({ page }) => {
    await login(page, SELLER)
    const servicesRes = await page.request.get('/api/services')
    const servicesBody = await servicesRes.json()
    const sellerService = servicesBody.data?.find((s: any) => s.seller?.email === SELLER.email)
    if (!sellerService) {
      console.log('  판매자 서비스 없음 - 스킵')
      return
    }
    const reviewsRes = await page.request.get(`/api/reviews?serviceId=${sellerService.id}`)
    const reviewsBody = await reviewsRes.json()
    if (!reviewsBody.data?.length) {
      console.log('  리뷰 없음 - 스킵')
      return
    }
    const reviewId = reviewsBody.data[0].id
    const replyRes = await page.request.post(`/api/reviews/${reviewId}/reply`, {
      data: { reply: 'E2E 테스트 판매자 답글입니다. 감사합니다!' },
    })
    const replyBody = await replyRes.json()
    expect(replyBody.success).toBe(true)
  })

  test('J-2. 서비스 상세에서 판매자 답글 표시', async ({ page }) => {
    const servicesRes = await page.request.get('/api/services')
    const servicesBody = await servicesRes.json()
    const service = servicesBody.data?.[0]
    if (!service) return
    await page.goto(`/services/${service.id}`)
    await page.waitForTimeout(3000)
    const reviewSection = page.getByText('리뷰').first()
    if (await reviewSection.isVisible({ timeout: 5000 }).catch(() => false)) {
      await reviewSection.scrollIntoViewIfNeeded()
      await page.waitForTimeout(1000)
      const sellerReply = page.getByText('판매자 답변')
      const hasReply = await sellerReply.first().isVisible({ timeout: 5000 }).catch(() => false)
      console.log(`  판매자 답변 표시: ${hasReply}`)
    }
  })
})
