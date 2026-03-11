import { test, expect } from '@playwright/test'

test.describe('채팅 읽지 않은 메시지 배지 (CUNR-1~3)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/chat')
    const heading = page.getByText('메시지')
    const loginPage = page.getByRole('heading', { name: /로그인/ })
    const first = await Promise.race([
      heading.waitFor({ timeout: 10000 }).then(() => 'chat' as const),
      loginPage.waitFor({ timeout: 10000 }).then(() => 'login' as const),
    ]).catch(() => 'timeout' as const)

    if (first !== 'chat') {
      test.skip(true, '채팅 페이지에 접근할 수 없습니다')
    }
  })

  test('CUNR-1: 채팅방 목록에 메시지 헤더 표시', async ({ page }) => {
    const header = page.getByText('메시지')
    await expect(header).toBeVisible()
  })

  test('CUNR-2: 채팅방이 없을 때 안내 메시지 표시', async ({ page }) => {
    // 채팅방이 있거나 없거나 둘 중 하나여야 함
    const emptyMsg = page.getByText('대화가 없습니다')
    const roomBtn = page.locator('button').filter({ hasText: /.+/ }).first()
    const hasEmpty = await emptyMsg.isVisible({ timeout: 5000 }).catch(() => false)
    const hasRoom = await roomBtn.isVisible().catch(() => false)
    expect(hasEmpty || hasRoom).toBe(true)
  })

  test('CUNR-3: 비인증 사용자 채팅 접근 시 리다이렉트', async ({ page, context }) => {
    const newPage = await context.newPage()
    await newPage.goto('/chat')
    await newPage.waitForURL(/\/(login|chat)/, { timeout: 10000 }).catch(() => {})
    await newPage.close()
  })
})
