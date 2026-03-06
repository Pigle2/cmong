import { test, expect, type Page } from '@playwright/test'
import { BUYER, SELLER, TIMEOUT, login } from './helpers'

const BASE_URL = 'https://cmong-chi.vercel.app'
const ROOM_BTN = 'button[class*="border-b"][class*="w-full"]'

// ── 기본 채팅 기능 ──

test.describe('채팅 - 기본', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, BUYER)
  })

  test('B-6. 채팅 페이지 접근', async ({ page }) => {
    await page.goto('/chat')
    await page.waitForTimeout(5000)
    const body = page.locator('body')
    const hasChat = await body.getByText(/대화를 선택|대화 목록|채팅/).first().isVisible({ timeout: TIMEOUT }).catch(() => false)
    expect(hasChat).toBeTruthy()
  })

  test('B-8. 서비스 상세 → 문의하기 → 채팅방 이동', async ({ page }) => {
    await page.goto('/services')
    const card = page.locator('[class*="card"] a, a[href*="services/"]').first()
    await expect(card).toBeVisible({ timeout: TIMEOUT })
    await card.click()
    await page.waitForURL(/services\//, { timeout: TIMEOUT })
    const inquiryBtn = page.getByText('문의하기').first()
    await expect(inquiryBtn).toBeVisible({ timeout: TIMEOUT })
    await inquiryBtn.click()
    await expect(page).toHaveURL(/chat/, { timeout: TIMEOUT })
    await page.waitForTimeout(5000)
  })

  test('B-9. 채팅 → 채팅방 선택 → 기존 메시지 로드 + 새 메시지 전송', async ({ page }) => {
    await page.goto('/chat')
    await page.waitForTimeout(5000)

    const roomItem = page.locator(ROOM_BTN).first()
    if (!await roomItem.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, '채팅방 없음')
      return
    }
    await roomItem.click()

    const input = page.locator('input[placeholder*="메시지"]')
    await expect(input).toBeVisible({ timeout: TIMEOUT })
    await expect(page.getByText('메시지 로딩 중...')).not.toBeVisible({ timeout: TIMEOUT })

    const hasBubble = await page.locator('[class*="rounded"]').filter({ hasText: /.+/ }).first().isVisible({ timeout: 5000 }).catch(() => false)
    const isEmpty = await page.getByText('첫 메시지를 보내보세요').isVisible({ timeout: 3000 }).catch(() => false)
    expect(hasBubble || isEmpty).toBeTruthy()

    const testMsg = `테스트-${Date.now()}`
    await input.fill(testMsg)
    const sendBtn = page.locator('button[type="submit"]')
    await sendBtn.click()
    await page.waitForTimeout(3000)
    await expect(page.getByText(testMsg)).toBeVisible({ timeout: TIMEOUT })
  })
})

// ── 실시간 채팅 (구매자 ↔ 판매자 동시 접속) ──
// 두 브라우저 컨텍스트로 같은 채팅방에 접속하여 실시간 메시지 교환 테스트

test.describe('채팅 - 실시간', () => {
  // 실시간 테스트는 2개 브라우저 + Realtime 대기 필요
  test.setTimeout(90000)

  // 헬퍼: 채팅 페이지에서 특정 사용자 이름이 포함된 채팅방 선택
  async function selectRoomByName(page: Page, otherUserName: string) {
    await page.goto('/chat')
    await page.waitForTimeout(5000)
    // 상대방 이름이 포함된 채팅방 버튼 찾기
    const room = page.locator(ROOM_BTN).filter({ hasText: otherUserName }).first()
    if (!await room.isVisible({ timeout: 5000 }).catch(() => false)) {
      // 이름 못 찾으면 첫 번째 방 선택
      const firstRoom = page.locator(ROOM_BTN).first()
      if (!await firstRoom.isVisible({ timeout: 5000 }).catch(() => false)) return false
      await firstRoom.click()
    } else {
      await room.click()
    }
    // 메시지 입력란 대기
    await expect(page.locator('input[placeholder*="메시지"]')).toBeVisible({ timeout: TIMEOUT })
    await expect(page.getByText('메시지 로딩 중...')).not.toBeVisible({ timeout: TIMEOUT })
    return true
  }

  test('RT-1. 구매자가 보낸 메시지가 판매자에게 실시간 표시', async ({ browser }) => {
    const buyerCtx = await browser.newContext({ baseURL: BASE_URL })
    const sellerCtx = await browser.newContext({ baseURL: BASE_URL })
    const buyerPage = await buyerCtx.newPage()
    const sellerPage = await sellerCtx.newPage()

    try {
      await login(buyerPage, BUYER)
      await login(sellerPage, SELLER)

      // 구매자: 판매자 이름으로 방 선택, 판매자: 구매자 이름으로 방 선택
      const buyerOk = await selectRoomByName(buyerPage, '디자인마스터')
      const sellerOk = await selectRoomByName(sellerPage, '구매자김철수')
      if (!buyerOk || !sellerOk) {
        test.skip(true, '채팅방 없음')
        return
      }

      // Realtime 구독 안정화 대기
      await buyerPage.waitForTimeout(2000)
      await sellerPage.waitForTimeout(2000)

      // 구매자 → 메시지 전송
      const buyerMsg = `구매자RT1-${Date.now()}`
      await buyerPage.locator('input[placeholder*="메시지"]').fill(buyerMsg)
      await buyerPage.locator('button[type="submit"]').click()

      // 구매자 화면 확인
      await expect(buyerPage.getByText(buyerMsg)).toBeVisible({ timeout: TIMEOUT })

      // 판매자 화면에 실시간 수신 (최대 20초 대기)
      await expect(sellerPage.getByText(buyerMsg)).toBeVisible({ timeout: 20000 })
      console.log('  ✓ 구매자 → 판매자 실시간 전달 성공')
    } finally {
      await buyerCtx.close().catch(() => {})
      await sellerCtx.close().catch(() => {})
    }
  })

  test('RT-2. 판매자가 보낸 메시지가 구매자에게 실시간 표시', async ({ browser }) => {
    const buyerCtx = await browser.newContext({ baseURL: BASE_URL })
    const sellerCtx = await browser.newContext({ baseURL: BASE_URL })
    const buyerPage = await buyerCtx.newPage()
    const sellerPage = await sellerCtx.newPage()

    try {
      await login(buyerPage, BUYER)
      await login(sellerPage, SELLER)

      const buyerOk = await selectRoomByName(buyerPage, '디자인마스터')
      const sellerOk = await selectRoomByName(sellerPage, '구매자김철수')
      if (!buyerOk || !sellerOk) {
        test.skip(true, '채팅방 없음')
        return
      }

      await buyerPage.waitForTimeout(2000)
      await sellerPage.waitForTimeout(2000)

      // 판매자 → 메시지 전송
      const sellerMsg = `판매자RT2-${Date.now()}`
      await sellerPage.locator('input[placeholder*="메시지"]').fill(sellerMsg)
      await sellerPage.locator('button[type="submit"]').click()

      await expect(sellerPage.getByText(sellerMsg)).toBeVisible({ timeout: TIMEOUT })
      await expect(buyerPage.getByText(sellerMsg)).toBeVisible({ timeout: 20000 })
      console.log('  ✓ 판매자 → 구매자 실시간 전달 성공')
    } finally {
      await buyerCtx.close().catch(() => {})
      await sellerCtx.close().catch(() => {})
    }
  })

  test('RT-3. 양방향 대화 - 구매자↔판매자 연속 메시지 교환', async ({ browser }) => {
    const buyerCtx = await browser.newContext({ baseURL: BASE_URL })
    const sellerCtx = await browser.newContext({ baseURL: BASE_URL })
    const buyerPage = await buyerCtx.newPage()
    const sellerPage = await sellerCtx.newPage()

    try {
      await login(buyerPage, BUYER)
      await login(sellerPage, SELLER)

      const buyerOk = await selectRoomByName(buyerPage, '디자인마스터')
      const sellerOk = await selectRoomByName(sellerPage, '구매자김철수')
      if (!buyerOk || !sellerOk) {
        test.skip(true, '채팅방 없음')
        return
      }

      await buyerPage.waitForTimeout(2000)
      await sellerPage.waitForTimeout(2000)

      const buyerInput = buyerPage.locator('input[placeholder*="메시지"]')
      const sellerInput = sellerPage.locator('input[placeholder*="메시지"]')
      const ts = Date.now()

      // 1) 구매자: 메시지 전송
      const msg1 = `안녕-${ts}`
      await buyerInput.fill(msg1)
      await buyerPage.locator('button[type="submit"]').click()
      await expect(sellerPage.getByText(msg1)).toBeVisible({ timeout: 20000 })

      // 2) 판매자: 답장
      const msg2 = `반갑-${ts}`
      await sellerInput.fill(msg2)
      await sellerPage.locator('button[type="submit"]').click()
      await expect(buyerPage.getByText(msg2)).toBeVisible({ timeout: 20000 })

      // 3) 구매자: 추가 메시지
      const msg3 = `작업-${ts}`
      await buyerInput.fill(msg3)
      await buyerPage.locator('button[type="submit"]').click()
      await expect(sellerPage.getByText(msg3)).toBeVisible({ timeout: 20000 })

      // 양쪽 모두 3개 메시지 확인
      for (const msg of [msg1, msg2, msg3]) {
        await expect(buyerPage.getByText(msg)).toBeVisible()
        await expect(sellerPage.getByText(msg)).toBeVisible()
      }

      console.log('  ✓ 양방향 3회 메시지 교환 성공')
    } finally {
      await buyerCtx.close().catch(() => {})
      await sellerCtx.close().catch(() => {})
    }
  })
})
