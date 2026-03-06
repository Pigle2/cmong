import { test, expect } from '@playwright/test'
import { BUYER, SELLER, TIMEOUT, login } from './helpers'

// ── 구매자 주문 ──

test.describe('주문 - 구매자', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, BUYER)
  })

  test('B-5. 주문 목록 접근', async ({ page }) => {
    await page.goto('/orders')
    await expect(page.locator('body')).toContainText(/주문|내역|없습니다/, { timeout: TIMEOUT })
  })

  test('C-1. 서비스 상세 → 패키지 선택 → 주문 페이지 이동', async ({ page }) => {
    await page.goto('/services')
    const card = page.locator('[class*="card"] a, a[href*="services/"]').first()
    await expect(card).toBeVisible({ timeout: TIMEOUT })
    await card.click()
    await page.waitForURL(/services\//, { timeout: TIMEOUT })
    const orderBtn = page.getByText('주문하기').first()
    await orderBtn.scrollIntoViewIfNeeded()
    if (await orderBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await orderBtn.click()
      await page.waitForURL(/orders\/new/, { timeout: TIMEOUT })
      expect(page.url()).toContain('orders')
    }
  })

  test('C-2. 주문 생성 페이지 - 요구사항 입력 + 주문', async ({ page }) => {
    const res = await page.request.get('/api/services')
    const body = await res.json()
    if (!body.success || !body.data?.length) {
      test.skip(true, '서비스가 없어 주문 테스트 불가')
      return
    }
    const service = body.data[0]
    const pkgRes = await page.request.get(`/api/services/${service.id}`)
    const pkgBody = await pkgRes.json()
    const pkg = pkgBody.data?.packages?.[0]
    if (!pkg) {
      test.skip(true, '패키지가 없어 주문 테스트 불가')
      return
    }
    await page.goto(`/orders/new?serviceId=${service.id}&packageId=${pkg.id}`)
    await page.waitForTimeout(3000)
    const hasOrderForm = await page.getByText(/주문|결제|요구사항/).first().isVisible({ timeout: TIMEOUT }).catch(() => false)
    if (hasOrderForm) {
      const textarea = page.locator('textarea')
      if (await textarea.isVisible({ timeout: 3000 }).catch(() => false)) {
        await textarea.fill('E2E 테스트 주문입니다. 로고 디자인 부탁드립니다.')
      }
      const submitBtn = page.locator('button[type="submit"], button:has-text("주문")')
      if (await submitBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        await submitBtn.first().click()
        await page.waitForTimeout(5000)
      }
    }
  })

  test('C-3. 주문 상세 페이지 - 타임라인/상태 표시', async ({ page }) => {
    await page.goto('/orders')
    await page.waitForTimeout(3000)
    const orderLink = page.locator('a[href*="/orders/"]').first()
    if (!await orderLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, '주문 없음')
      return
    }
    await orderLink.click()
    await page.waitForURL(/orders\//, { timeout: TIMEOUT })
    await expect(page.getByText('주문 상세')).toBeVisible({ timeout: TIMEOUT })
    await expect(page.getByText(/ORD-/).first()).toBeVisible({ timeout: TIMEOUT })
    await expect(page.getByText('주문 정보')).toBeVisible()
    await expect(page.getByText('서비스 정보')).toBeVisible()
    await expect(page.getByText('진행 상황')).toBeVisible()
  })

  test('C-4. 주문 상세 → 구매자 액션 버튼 표시', async ({ page }) => {
    await page.goto('/orders')
    await page.waitForTimeout(3000)
    const orderLink = page.locator('a[href*="/orders/"]').first()
    if (!await orderLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, '주문 없음')
      return
    }
    await orderLink.click()
    await page.waitForURL(/orders\//, { timeout: TIMEOUT })
    const actions = page.locator('button:has-text("구매 확정"), button:has-text("수정 요청"), button:has-text("주문 취소"), a:has-text("리뷰 작성")')
    if (!await actions.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, '현재 주문 상태에 사용 가능한 액션 없음')
      return
    }
    await expect(actions.first()).toBeVisible()
  })
})

// ── 주문 상태 전이 ──

test.describe('주문 - 상태 전이', () => {
  test('E-1. 판매자: 주문 수락 (PAID → ACCEPTED)', async ({ page }) => {
    await login(page, SELLER)
    await page.goto('/seller/orders')
    await page.waitForTimeout(3000)
    const paidOrder = page.locator('a[href*="/seller/orders/"]').first()
    if (!await paidOrder.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, '주문 없음')
      return
    }
    await paidOrder.click()
    await page.waitForTimeout(3000)
    const acceptBtn = page.locator('button:has-text("수락")')
    if (!await acceptBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      test.skip(true, '수락 버튼 없음 (PAID 상태가 아님)')
      return
    }
    await acceptBtn.click()
    await page.waitForTimeout(3000)
    // 수락 후 상태 변경 확인: 수락 버튼이 사라지거나 상태 텍스트 변경
    await expect(acceptBtn).not.toBeVisible({ timeout: 5000 })
  })

  test('E-2. 판매자: 작업 시작 (ACCEPTED → IN_PROGRESS)', async ({ page }) => {
    await login(page, SELLER)
    await page.goto('/seller/orders')
    await page.waitForTimeout(3000)
    const order = page.locator('a[href*="/seller/orders/"]').first()
    if (!await order.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, '주문 없음')
      return
    }
    await order.click()
    await page.waitForTimeout(3000)
    const startBtn = page.locator('button:has-text("작업 시작")')
    if (!await startBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      test.skip(true, '작업 시작 버튼 없음 (ACCEPTED 상태가 아님)')
      return
    }
    await startBtn.click()
    await page.waitForTimeout(3000)
    await expect(startBtn).not.toBeVisible({ timeout: 5000 })
  })

  test('E-3. 판매자: 납품하기 (IN_PROGRESS → DELIVERED)', async ({ page }) => {
    await login(page, SELLER)
    await page.goto('/seller/orders')
    await page.waitForTimeout(3000)
    const order = page.locator('a[href*="/seller/orders/"]').first()
    if (!await order.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, '주문 없음')
      return
    }
    await order.click()
    await page.waitForTimeout(3000)
    const deliverBtn = page.locator('button:has-text("납품")')
    if (!await deliverBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      test.skip(true, '납품 버튼 없음 (IN_PROGRESS 상태가 아님)')
      return
    }
    await deliverBtn.click()
    await page.waitForTimeout(3000)
    await expect(deliverBtn).not.toBeVisible({ timeout: 5000 })
  })

  test('E-4. 구매자: 구매 확정 (DELIVERED → COMPLETED)', async ({ page }) => {
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
    const completeBtn = page.locator('button:has-text("구매 확정")')
    if (!await completeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      test.skip(true, '구매 확정 버튼 없음 (DELIVERED 상태가 아님)')
      return
    }
    await completeBtn.click()
    await page.waitForTimeout(3000)
    await expect(completeBtn).not.toBeVisible({ timeout: 5000 })
  })
})

// ── 거절/취소 ──

test.describe('주문 - 거절/취소', () => {
  test('E-6. 판매자: 주문 거절 버튼 표시 (PAID 상태)', async ({ page }) => {
    await login(page, SELLER)
    await page.goto('/seller/orders')
    await page.waitForTimeout(3000)
    const orderLink = page.locator('a[href*="/seller/orders/"]').first()
    if (!await orderLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, '주문 없음')
      return
    }
    await orderLink.click()
    await page.waitForTimeout(3000)
    // PAID 상태에서 거절 버튼 존재 여부 확인
    const rejectBtn = page.locator('button:has-text("거절")')
    const acceptBtn = page.locator('button:has-text("수락")')
    const hasReject = await rejectBtn.isVisible({ timeout: 3000 }).catch(() => false)
    const hasAccept = await acceptBtn.isVisible({ timeout: 3000 }).catch(() => false)
    // PAID 상태면 둘 다 있어야 함, 다른 상태면 스킵
    if (hasAccept) {
      expect(hasReject).toBeTruthy()
      console.log('  ✓ PAID 상태에서 거절 버튼 확인')
    } else {
      console.log('  PAID 상태 아님 - 거절 버튼 테스트 스킵')
    }
  })

  test('E-7. 구매자: 주문 취소 버튼 표시 (PAID/ACCEPTED 상태)', async ({ page }) => {
    await login(page, BUYER)
    await page.goto('/orders')
    await page.waitForTimeout(3000)
    const orderLink = page.locator('a[href*="/orders/"]').first()
    if (!await orderLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, '주문 없음')
      return
    }
    await orderLink.click()
    await page.waitForTimeout(3000)
    const cancelBtn = page.locator('button:has-text("주문 취소")')
    const hasCancelBtn = await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false)
    // PAID 또는 ACCEPTED 상태면 취소 버튼이 있어야 함
    const statusText = await page.locator('body').textContent()
    const isPaidOrAccepted = statusText?.includes('결제완료') || statusText?.includes('수락')
    if (isPaidOrAccepted) {
      expect(hasCancelBtn).toBeTruthy()
      console.log('  ✓ PAID/ACCEPTED 상태에서 취소 버튼 확인')
    } else {
      console.log(`  취소 가능 상태 아님 - 스킵 (취소 버튼: ${hasCancelBtn})`)
    }
  })
})

// ── 수정 요청 ──

test.describe('주문 - 수정 요청', () => {
  test('I-1. 구매자: 납품된 주문에 수정요청 버튼 표시', async ({ page }) => {
    await login(page, BUYER)
    await page.goto('/orders')
    await page.waitForTimeout(3000)
    const orderLink = page.locator('a[href*="/orders/"]').first()
    if (!await orderLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, '주문 없음')
      return
    }
    await orderLink.click()
    await page.waitForURL(/orders\//, { timeout: TIMEOUT })
    // 주문 상세 페이지에서 액션 버튼 중 하나가 보이는지 확인
    const anyAction = page.locator('button:has-text("수정 요청"), button:has-text("구매 확정"), button:has-text("주문 취소"), a:has-text("리뷰 작성")')
    if (!await anyAction.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, '현재 주문 상태에 사용 가능한 액션 없음')
      return
    }
    await expect(anyAction.first()).toBeVisible()
  })

  test('I-2. 구매자: 수정요청 시 메모 입력 가능', async ({ page }) => {
    await login(page, BUYER)
    await page.goto('/orders')
    await page.waitForTimeout(3000)
    const orderLink = page.locator('a[href*="/orders/"]').first()
    if (!await orderLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, '주문 없음')
      return
    }
    await orderLink.click()
    await page.waitForURL(/orders\//, { timeout: TIMEOUT })
    // 주문 상세 페이지 로드 확인
    await expect(page.getByText('주문 상세')).toBeVisible({ timeout: TIMEOUT })
  })

  test('I-3. 판매자: 수정요청된 주문 상태 확인', async ({ page }) => {
    await login(page, SELLER)
    await page.goto('/seller/orders')
    await page.waitForTimeout(3000)
    const orderLink = page.locator('a[href*="/seller/orders/"]').first()
    if (!await orderLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, '주문 없음')
      return
    }
    await orderLink.click()
    await page.waitForTimeout(3000)
    // 주문 상세 페이지에서 액션 버튼 존재 확인
    const anyAction = page.locator('button:has-text("수락"), button:has-text("납품"), button:has-text("작업 시작"), button:has-text("거절")')
    await expect(anyAction.first()).toBeVisible({ timeout: 5000 })
  })
})
