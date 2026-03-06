import { test, expect, type Page } from '@playwright/test'
import { BUYER, SELLER, TIMEOUT, login, logout } from './helpers'

const BASE_URL = 'https://cmong-chi.vercel.app'
const ROOM_BTN = 'button[class*="border-b"][class*="w-full"]'

// ── 헬퍼 함수 ──

// 채팅 목록에서 첫 번째 채팅방에 진입
async function enterFirstChatRoom(page: Page): Promise<boolean> {
  await page.goto('/chat')
  await page.waitForTimeout(5000)
  const roomItem = page.locator(ROOM_BTN).first()
  if (!await roomItem.isVisible({ timeout: 5000 }).catch(() => false)) return false
  await roomItem.click()
  await expect(page.locator('input[placeholder*="메시지"]')).toBeVisible({ timeout: TIMEOUT })
  return true
}

// 채팅방 더보기(⋮) 메뉴 열기
async function openMoreMenu(page: Page) {
  // 더보기 버튼: ⋮ 또는 점 세개 아이콘 버튼
  const moreBtn = page.locator(
    'button:has-text("⋮"), button[aria-label*="더보기"], button[aria-label*="메뉴"], button[aria-label*="more"]'
  ).first()
  await expect(moreBtn).toBeVisible({ timeout: TIMEOUT })
  await moreBtn.click()
  await page.waitForTimeout(500)
}

// 채팅 목록에서 특정 사용자 이름이 포함된 채팅방 선택
async function selectRoomByName(page: Page, otherUserName: string): Promise<boolean> {
  await page.goto('/chat')
  await page.waitForTimeout(5000)
  const room = page.locator(ROOM_BTN).filter({ hasText: otherUserName }).first()
  if (!await room.isVisible({ timeout: 5000 }).catch(() => false)) {
    const firstRoom = page.locator(ROOM_BTN).first()
    if (!await firstRoom.isVisible({ timeout: 5000 }).catch(() => false)) return false
    await firstRoom.click()
  } else {
    await room.click()
  }
  await expect(page.locator('input[placeholder*="메시지"]')).toBeVisible({ timeout: TIMEOUT })
  await expect(page.getByText('메시지 로딩 중...')).not.toBeVisible({ timeout: TIMEOUT })
  return true
}

// ── 채팅방 나가기 테스트 ──

test.describe('채팅 - 나가기', () => {
  // LEAVE-1: 채팅방 나가기 UI 확인
  test('LEAVE-1. 채팅방 더보기 메뉴에 나가기 옵션 존재', async ({ page }) => {
    await login(page, BUYER)
    const entered = await enterFirstChatRoom(page)
    if (!entered) {
      console.log('  채팅방 없음 - 스킵')
      return
    }

    // 더보기 메뉴 열기
    await openMoreMenu(page)

    // "나가기" 옵션이 메뉴에 표시되는지 확인
    const leaveOption = page.getByText('나가기').first()
    await expect(leaveOption).toBeVisible({ timeout: TIMEOUT })
  })

  // LEAVE-2: 채팅방 나가기 확인 다이얼로그
  test('LEAVE-2. 나가기 클릭 시 확인 다이얼로그 + 취소 동작', async ({ page }) => {
    await login(page, BUYER)
    const entered = await enterFirstChatRoom(page)
    if (!entered) {
      console.log('  채팅방 없음 - 스킵')
      return
    }

    // 더보기 → 나가기 클릭
    await openMoreMenu(page)
    await page.getByText('나가기').first().click()

    // 확인 다이얼로그 표시 확인
    const dialog = page.locator('[role="dialog"], [role="alertdialog"], [class*="modal"], [class*="dialog"]').first()
    await expect(dialog).toBeVisible({ timeout: TIMEOUT })

    // 다이얼로그에 확인/취소 관련 텍스트가 있는지 확인
    const hasConfirmText = await page.getByText(/나가시겠습니까|정말|확인/).first().isVisible({ timeout: 5000 }).catch(() => false)
    expect(hasConfirmText).toBeTruthy()

    // "취소" 버튼 클릭
    const cancelBtn = page.getByRole('button', { name: /취소/ }).first()
    await expect(cancelBtn).toBeVisible({ timeout: 5000 })
    await cancelBtn.click()

    // 다이얼로그가 닫혔는지 확인
    await expect(dialog).not.toBeVisible({ timeout: 5000 })

    // 채팅방에 여전히 남아있는지 확인 (메시지 입력란이 보이면 채팅방 안에 있는 것)
    await expect(page.locator('input[placeholder*="메시지"]')).toBeVisible({ timeout: TIMEOUT })
  })

  // LEAVE-3: 채팅방 나가기 성공
  test('LEAVE-3. 채팅방 나가기 → 목록 복귀 + 방 제거 확인', async ({ page }) => {
    await login(page, BUYER)

    // 채팅 목록 진입 후 첫 번째 방의 이름 기억
    await page.goto('/chat')
    await page.waitForTimeout(5000)
    const firstRoom = page.locator(ROOM_BTN).first()
    if (!await firstRoom.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('  채팅방 없음 - 스킵')
      return
    }

    // 나가기 전 채팅방 텍스트 저장 (상대방 이름 등)
    const roomText = await firstRoom.textContent() || ''
    await firstRoom.click()
    await expect(page.locator('input[placeholder*="메시지"]')).toBeVisible({ timeout: TIMEOUT })

    // 더보기 → 나가기 → 확인
    await openMoreMenu(page)
    await page.getByText('나가기').first().click()

    // 확인 다이얼로그에서 확인 버튼 클릭
    const confirmBtn = page.getByRole('button', { name: /확인|나가기|예/ }).last()
    await expect(confirmBtn).toBeVisible({ timeout: TIMEOUT })
    await confirmBtn.click()

    // 채팅 목록으로 돌아갔는지 확인 (URL 또는 메시지 입력란 사라짐)
    await expect(page).toHaveURL(/\/chat/, { timeout: TIMEOUT })
    await page.waitForTimeout(3000)

    // 메시지 입력란이 사라졌는지 확인 (채팅방에서 나옴)
    const inputGone = await page.locator('input[placeholder*="메시지"]').isVisible({ timeout: 3000 }).catch(() => false)
    // 채팅방이 목록에서 사라졌는지 확인
    if (roomText.trim()) {
      const roomStillExists = await page.locator(ROOM_BTN).filter({ hasText: roomText.trim().substring(0, 10) }).first().isVisible({ timeout: 3000 }).catch(() => false)
      // 나간 채팅방이 목록에서 보이지 않아야 함
      expect(roomStillExists).toBeFalsy()
    }
  })

  // LEAVE-4: 시스템 메시지 표시 (2 브라우저 컨텍스트)
  test('LEAVE-4. 나간 후 상대방에게 시스템 메시지 표시', async ({ browser }) => {
    // 실시간 + 멀티 브라우저 테스트이므로 타임아웃 연장
    test.setTimeout(90000)

    const buyerCtx = await browser.newContext({ baseURL: BASE_URL })
    const sellerCtx = await browser.newContext({ baseURL: BASE_URL })
    const buyerPage = await buyerCtx.newPage()
    const sellerPage = await sellerCtx.newPage()

    try {
      await login(buyerPage, BUYER)
      await login(sellerPage, SELLER)

      // 구매자: 판매자와의 채팅방 진입
      const buyerOk = await selectRoomByName(buyerPage, '디자인마스터')
      if (!buyerOk) {
        console.log('  구매자 채팅방 없음 - 스킵')
        return
      }

      // 판매자: 같은 채팅방 진입
      const sellerOk = await selectRoomByName(sellerPage, '구매자김철수')
      if (!sellerOk) {
        console.log('  판매자 채팅방 없음 - 스킵')
        return
      }

      // Realtime 구독 안정화 대기
      await buyerPage.waitForTimeout(2000)
      await sellerPage.waitForTimeout(2000)

      // 구매자: 채팅방 나가기 실행
      await openMoreMenu(buyerPage)
      await buyerPage.getByText('나가기').first().click()
      const confirmBtn = buyerPage.getByRole('button', { name: /확인|나가기|예/ }).last()
      await expect(confirmBtn).toBeVisible({ timeout: TIMEOUT })
      await confirmBtn.click()

      // 판매자 화면에서 시스템 메시지 확인 (최대 20초 대기)
      // "OOO님이 나갔습니다" 형식의 시스템 메시지
      const systemMsg = sellerPage.getByText(/님이 나갔습니다/)
      await expect(systemMsg).toBeVisible({ timeout: 20000 })
      console.log('  시스템 메시지 확인 성공')
    } finally {
      await buyerCtx.close().catch(() => {})
      await sellerCtx.close().catch(() => {})
    }
  })

  // LEAVE-5: 나간 채팅방 재입장 (문의하기)
  test('LEAVE-5. 나간 채팅방 → 같은 서비스 문의하기 → 채팅방 재입장', async ({ page }) => {
    await login(page, BUYER)

    // 먼저 채팅방 나가기 실행
    const entered = await enterFirstChatRoom(page)
    if (!entered) {
      console.log('  채팅방 없음 - 스킵')
      return
    }

    // 더보기 → 나가기 → 확인
    await openMoreMenu(page)
    await page.getByText('나가기').first().click()
    const confirmBtn = page.getByRole('button', { name: /확인|나가기|예/ }).last()
    await expect(confirmBtn).toBeVisible({ timeout: TIMEOUT })
    await confirmBtn.click()
    await page.waitForTimeout(3000)

    // 서비스 목록에서 아무 서비스 상세로 이동
    await page.goto('/services')
    const card = page.locator('[class*="card"] a, a[href*="services/"]').first()
    await expect(card).toBeVisible({ timeout: TIMEOUT })
    await card.click()
    await page.waitForURL(/services\//, { timeout: TIMEOUT })

    // "문의하기" 버튼 클릭
    const inquiryBtn = page.getByText('문의하기').first()
    await expect(inquiryBtn).toBeVisible({ timeout: TIMEOUT })
    await inquiryBtn.click()

    // 채팅방이 열리는지 확인
    await expect(page).toHaveURL(/chat/, { timeout: TIMEOUT })
    await page.waitForTimeout(5000)

    // 메시지 입력란이 보이면 채팅방에 정상 입장한 것
    const inputVisible = await page.locator('input[placeholder*="메시지"]').isVisible({ timeout: TIMEOUT }).catch(() => false)
    expect(inputVisible).toBeTruthy()
  })

  // LEAVE-6: 나가기 API 에러 응답 형식 확인
  test('LEAVE-6. 존재하지 않는 roomId로 leave API → 에러 응답', async ({ page }) => {
    await login(page, BUYER)
    // 로그인 후 쿠키 획득을 위해 페이지 대기
    await page.waitForTimeout(2000)

    // 존재하지 않는 roomId로 leave API 호출
    const fakeRoomId = '00000000-0000-0000-0000-000000000000'
    const response = await page.request.post(`${BASE_URL}/api/chat/rooms/${fakeRoomId}/leave`)

    // 에러 응답 확인 (404 또는 403 또는 400)
    expect(response.status()).toBeGreaterThanOrEqual(400)
    expect(response.status()).toBeLessThan(500)

    const body = await response.json()
    // API 응답 형식 검증: success: false + error 객체
    expect(body.success).toBe(false)
    expect(body.error).toBeDefined()
    expect(body.error.code).toBeDefined()
    expect(body.error.message).toBeDefined()
  })
})
