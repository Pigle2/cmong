import { test, expect } from '@playwright/test'
import { BUYER, TIMEOUT, login, logout } from './helpers'

// ── 비로그인: 로그인/회원가입 UI ──

test.describe('인증 - 비로그인', () => {
  test('A-7. 로그인 페이지 로드', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByPlaceholder('example@email.com')).toBeVisible()
    await expect(page.getByRole('button', { name: '로그인' })).toBeVisible()
    await expect(page.getByText('회원가입')).toBeVisible()
  })

  test('A-8. 회원가입 페이지 로드', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByPlaceholder('example@email.com')).toBeVisible()
    await expect(page.getByPlaceholder(/닉네임/)).toBeVisible()
    await expect(page.locator('input[type="password"]').first()).toBeVisible()
    await expect(page.getByText('구매자')).toBeVisible()
  })

  test('A-9. 비로그인 시 보호 페이지 리다이렉트', async ({ page }) => {
    await page.goto('/orders')
    await expect(page).toHaveURL(/login/, { timeout: TIMEOUT })
    await page.goto('/mypage')
    await expect(page).toHaveURL(/login/, { timeout: TIMEOUT })
    await page.goto('/seller/dashboard')
    await expect(page).toHaveURL(/login/, { timeout: TIMEOUT })
  })

  test('A-10. 로그인 실패 - 잘못된 비밀번호', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', BUYER.email)
    await page.fill('input[type="password"]', 'WrongPass123!')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(3000)
    await expect(page).toHaveURL(/login/)
    await expect(page.getByText(/올바르지 않|실패|invalid/i)).toBeVisible({ timeout: 5000 })
  })

  test('H-4. 회원가입 - 유효성 검증', async ({ page }) => {
    await page.goto('/register')
    const submitBtn = page.locator('button[type="submit"]')
    await submitBtn.click()
    await page.waitForTimeout(2000)
    await expect(page).toHaveURL(/register/)
  })

  test('H-5. 비밀번호 찾기 페이지 UI', async ({ page }) => {
    await page.goto('/forgot-password')
    await expect(page.getByText('비밀번호 찾기')).toBeVisible({ timeout: TIMEOUT })
    await expect(page.getByText('재설정 링크를 보내드립니다')).toBeVisible()
    await expect(page.getByPlaceholder('example@email.com')).toBeVisible()
    await expect(page.getByRole('button', { name: '재설정 링크 발송' })).toBeVisible()
    await expect(page.getByText('로그인으로 돌아가기')).toBeVisible()
  })

  test('H-6. 비밀번호 찾기 - 잘못된 이메일 유효성 검증', async ({ page }) => {
    await page.goto('/forgot-password')
    // 빈 이메일로 제출
    await page.click('button[type="submit"]')
    await page.waitForTimeout(1000)
    await expect(page).toHaveURL(/forgot-password/)

    // 잘못된 이메일 형식
    await page.fill('input[type="email"]', 'invalid-email')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(1000)
    await expect(page.getByText(/올바른 이메일/)).toBeVisible({ timeout: 5000 })
  })

  test('H-7. 회원가입 - 비밀번호 불일치 검증', async ({ page }) => {
    await page.goto('/register')
    await page.fill('input[type="email"]', 'test-h7@example.com')
    await page.fill('input[placeholder*="닉네임"]', '테스트유저')
    const passwordInputs = page.locator('input[type="password"]')
    await passwordInputs.nth(0).fill('Test1234!')
    await passwordInputs.nth(1).fill('Different1234!')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(2000)
    await expect(page.getByText(/일치하지 않/)).toBeVisible({ timeout: 5000 })
    await expect(page).toHaveURL(/register/)
  })

  test('H-8. 회원가입 - 약한 비밀번호 검증', async ({ page }) => {
    await page.goto('/register')
    await page.fill('input[type="email"]', 'test-h8@example.com')
    await page.fill('input[placeholder*="닉네임"]', '테스트유저')
    const passwordInputs = page.locator('input[type="password"]')
    // 8자 미만
    await passwordInputs.nth(0).fill('abc')
    await passwordInputs.nth(1).fill('abc')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(2000)
    await expect(page.getByText(/8자 이상/)).toBeVisible({ timeout: 5000 })
    await expect(page).toHaveURL(/register/)
  })

  test('H-9. 회원가입 - 잘못된 이메일 형식 시 페이지 유지', async ({ page }) => {
    await page.goto('/register')
    await page.fill('input[type="email"]', 'not-an-email')
    await page.fill('input[placeholder*="닉네임"]', '테스트유저')
    const passwordInputs = page.locator('input[type="password"]')
    await passwordInputs.nth(0).fill('Test1234!')
    await passwordInputs.nth(1).fill('Test1234!')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(2000)
    // 브라우저 네이티브 validation 또는 zod이 제출을 막아 페이지 유지
    await expect(page).toHaveURL(/register/)
  })
})

// ── 로그인 후: 헤더/메뉴/로그아웃 ──

test.describe('인증 - 로그인 후', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, BUYER)
  })

  test('B-1. 로그인 성공 → 헤더에 아바타 표시', async ({ page }) => {
    await page.goto('/')
    const avatar = page.locator('header [role="img"], header button:has(span.relative)')
    await expect(avatar.first()).toBeVisible({ timeout: TIMEOUT })
  })

  test('B-2. 유저 메뉴 드롭다운 - 로그아웃 존재', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(3000)
    const trigger = page.locator('header').locator('button').filter({ has: page.locator('[role="img"], span.relative') }).first()
    if (await trigger.isVisible({ timeout: 5000 }).catch(() => false)) {
      await trigger.click()
      await expect(page.getByText('로그아웃')).toBeVisible({ timeout: 5000 })
      await expect(page.getByText('마이페이지')).toBeVisible()
    } else {
      test.fail(true, '헤더에 유저 메뉴 트리거를 찾을 수 없음')
    }
  })

  test('B-3. 마이페이지 접근 - 프로필 정보 표시', async ({ page }) => {
    await page.goto('/mypage')
    await expect(page.getByText(/구매자김철수|buyer1/).first()).toBeVisible({ timeout: TIMEOUT })
    await expect(page.getByText('주문').first()).toBeVisible()
    await expect(page.getByText('찜').first()).toBeVisible()
    await expect(page.getByText('최근 주문')).toBeVisible()
  })

  test('B-4. 마이페이지 > 찜 목록 접근', async ({ page }) => {
    await page.goto('/mypage/favorites')
    await expect(page).toHaveURL(/favorites/)
    await expect(page.locator('body')).toContainText(/찜|서비스|없습니다/, { timeout: TIMEOUT })
  })

  test('B-11. 로그아웃 동작', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(3000)
    await logout(page)
    await page.goto('/mypage')
    await expect(page).toHaveURL(/login/, { timeout: TIMEOUT })
  })

  test('B-12. 로그아웃 후 보호 페이지 접근 차단', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(3000)
    await logout(page)

    // 모든 보호 페이지가 로그인으로 리다이렉트되는지 확인
    const protectedPages = ['/orders', '/chat', '/mypage', '/seller/dashboard', '/seller/services']
    for (const path of protectedPages) {
      await page.goto(path)
      await expect(page).toHaveURL(/login/, { timeout: TIMEOUT })
    }
  })

  test('B-13. 로그아웃 후 헤더에 로그인 버튼 표시', async ({ page }) => {
    // 로그인 상태에서 아바타 확인
    await page.goto('/')
    await page.waitForTimeout(3000)
    const avatar = page.locator('header [role="img"], header button:has(span.relative)')
    await expect(avatar.first()).toBeVisible({ timeout: TIMEOUT })

    // 로그아웃
    await logout(page)
    await page.goto('/')
    await page.waitForTimeout(3000)

    // 로그인 버튼 표시 확인
    const loginLink = page.locator('header').getByText('로그인')
    await expect(loginLink).toBeVisible({ timeout: TIMEOUT })
  })

  test('B-14. 로그아웃 후 브라우저 뒤로가기 시 보호 페이지 접근 불가', async ({ page }) => {
    // 마이페이지 방문
    await page.goto('/mypage')
    await expect(page.getByText(/구매자김철수|buyer1/).first()).toBeVisible({ timeout: TIMEOUT })

    // 로그아웃
    await logout(page)
    await page.goto('/login')
    await page.waitForTimeout(2000)

    // 뒤로가기 시도
    await page.goBack()
    await page.waitForTimeout(3000)

    // 로그인 페이지로 리다이렉트되거나 보호 콘텐츠 안 보여야 함
    const isLoginPage = await page.url().includes('/login')
    const hasProfile = await page.getByText(/구매자김철수/).isVisible({ timeout: 3000 }).catch(() => false)
    expect(isLoginPage || !hasProfile).toBeTruthy()
  })

  test('B-15. 로그아웃 후 재로그인 정상 동작', async ({ page }) => {
    // 로그아웃
    await page.goto('/')
    await page.waitForTimeout(3000)
    await logout(page)

    // 재로그인
    await login(page, BUYER)

    // 보호 페이지 정상 접근 확인
    await page.goto('/mypage')
    await expect(page.getByText(/구매자김철수|buyer1/).first()).toBeVisible({ timeout: TIMEOUT })
  })
})

// ── 설정 페이지 ──

test.describe('인증 - 설정', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, BUYER)
  })

  test('L-1. 설정 페이지 로드 - 닉네임/소개 필드 표시', async ({ page }) => {
    await page.goto('/mypage/settings')
    await page.waitForTimeout(5000)
    await expect(page.getByRole('heading', { name: '설정' })).toBeVisible({ timeout: TIMEOUT })
    await expect(page.getByText('닉네임')).toBeVisible()
    await expect(page.locator('input').first()).toBeVisible()
    await expect(page.getByText('소개')).toBeVisible()
    await expect(page.locator('textarea')).toBeVisible()
  })

  test('L-2. 닉네임/소개 수정 후 저장', async ({ page }) => {
    await page.goto('/mypage/settings')
    await page.waitForTimeout(3000)
    const bioTextarea = page.locator('textarea')
    if (await bioTextarea.isVisible({ timeout: 3000 }).catch(() => false)) {
      await bioTextarea.fill('E2E 테스트로 수정된 자기소개입니다.')
    }
    const saveBtn = page.getByRole('button', { name: '저장' })
    await expect(saveBtn).toBeVisible()
    await saveBtn.click()
    await page.waitForTimeout(3000)
    const toast = page.getByText('프로필이 수정되었습니다')
    await expect(toast).toBeVisible({ timeout: 5000 })
  })

  test('L-3. 마이페이지에서 설정 페이지 이동', async ({ page }) => {
    await page.goto('/mypage')
    await page.waitForTimeout(3000)
    const settingsLink = page.locator('a[href*="/settings"], button:has-text("설정")')
    await expect(settingsLink.first()).toBeVisible({ timeout: TIMEOUT })
    await settingsLink.first().click()
    await expect(page).toHaveURL(/settings/, { timeout: TIMEOUT })
  })
})

// ── 모드 전환 ──

test.describe('인증 - 모드 전환', () => {
  test('M-1. 구매자 → 판매자 모드 전환', async ({ page }) => {
    await login(page, BUYER)
    await page.goto('/')
    await page.waitForTimeout(3000)
    const toggleBtn = page.getByText('판매자 모드로 전환')
    await expect(toggleBtn).toBeVisible({ timeout: TIMEOUT })
    await toggleBtn.click()
    await page.waitForTimeout(2000)
    await expect(page.getByText('구매자 모드로 전환')).toBeVisible({ timeout: TIMEOUT })
    await expect(page.getByRole('link', { name: '판매자 홈' })).toBeVisible()
  })

  test('M-2. 판매자 → 구매자 모드 전환', async ({ page }) => {
    await login(page, BUYER)
    await page.goto('/')
    await page.waitForTimeout(3000)
    const toSeller = page.getByText('판매자 모드로 전환')
    if (await toSeller.isVisible({ timeout: 3000 }).catch(() => false)) {
      await toSeller.click()
      await page.waitForTimeout(2000)
    }
    const toBuyer = page.getByText('구매자 모드로 전환')
    await expect(toBuyer).toBeVisible({ timeout: TIMEOUT })
    await toBuyer.click()
    await page.waitForTimeout(2000)
    await expect(page.getByText('판매자 모드로 전환')).toBeVisible({ timeout: TIMEOUT })
  })

  test('M-3. 모드 전환 후 페이지 새로고침 시 유지', async ({ page }) => {
    await login(page, BUYER)
    await page.goto('/')
    await page.waitForTimeout(3000)
    const toggleBtn = page.getByText('판매자 모드로 전환')
    if (await toggleBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await toggleBtn.click()
      await page.waitForTimeout(2000)
    }
    await page.reload()
    await page.waitForTimeout(3000)
    await expect(page.getByText('구매자 모드로 전환')).toBeVisible({ timeout: TIMEOUT })
  })
})
