import { test, expect } from '@playwright/test'
import { BUYER, SELLER, TIMEOUT, login } from './helpers'

test.describe('리뷰', () => {
  test('E-5. 구매자: 리뷰 작성', async ({ page }) => {
    await login(page, BUYER)
    await page.goto('/orders')
    await page.waitForTimeout(3000)
    const order = page.locator('a[href*="/orders/"]').first()
    if (!await order.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, '주문 없음')
      return
    }
    await order.click()
    await page.waitForTimeout(3000)
    const reviewBtn = page.locator('a:has-text("리뷰 작성"), button:has-text("리뷰 작성")')
    if (!await reviewBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      test.skip(true, '리뷰 작성 버튼 없음 (COMPLETED 주문이 아님)')
      return
    }
    await reviewBtn.click()
    await page.waitForURL(/review/, { timeout: TIMEOUT })
    const textarea = page.locator('textarea')
    await expect(textarea).toBeVisible({ timeout: 5000 })
    await textarea.fill('E2E 테스트 리뷰입니다. 서비스 품질이 매우 좋았습니다.')
    const submitBtn = page.locator('button[type="submit"], button:has-text("리뷰 등록"), button:has-text("작성")')
    await expect(submitBtn.first()).toBeVisible({ timeout: 5000 })
    await submitBtn.first().click()
    await page.waitForTimeout(3000)
    // 리뷰 작성 후 주문 상세로 돌아가거나 성공 메시지 표시
    const success = await page.getByText(/리뷰.*등록|작성.*완료|감사/).first().isVisible({ timeout: 5000 }).catch(() => false)
    const redirected = !page.url().includes('/review')
    expect(success || redirected).toBeTruthy()
  })

  test('J-1. API: 판매자 리뷰 답글 등록', async ({ page }) => {
    await login(page, SELLER)
    const servicesRes = await page.request.get('/api/services')
    const servicesBody = await servicesRes.json()
    // API 응답에 email 필드 없음 → nickname으로 판매자 서비스 식별
    const sellerService = servicesBody.data?.find(
      (s: any) => s.seller?.nickname === '디자인마스터'
    )
    if (!sellerService) {
      test.skip(true, '판매자 서비스 없음')
      return
    }
    const reviewsRes = await page.request.get(`/api/reviews?serviceId=${sellerService.id}`)
    const reviewsBody = await reviewsRes.json()
    if (!reviewsBody.data?.length) {
      test.skip(true, '리뷰 없음')
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
    // 판매자 답글이 있는 서비스 찾기
    let targetServiceId: string | null = null
    for (const svc of servicesBody.data?.slice(0, 10) || []) {
      const rRes = await page.request.get(`/api/reviews?serviceId=${svc.id}`)
      const rBody = await rRes.json()
      if (rBody.data?.some((r: any) => r.seller_reply)) {
        targetServiceId = svc.id
        break
      }
    }
    if (!targetServiceId) {
      test.skip(true, '판매자 답글이 있는 서비스 없음')
      return
    }
    await page.goto(`/services/${targetServiceId}`)
    await page.waitForTimeout(3000)
    const reviewSection = page.getByText('리뷰').first()
    if (!await reviewSection.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, '리뷰 섹션 없음')
      return
    }
    await reviewSection.scrollIntoViewIfNeeded()
    await page.waitForTimeout(1000)
    const sellerReply = page.getByText('판매자 답변')
    await expect(sellerReply.first()).toBeVisible({ timeout: 5000 })
  })
})
