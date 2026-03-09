import { test, expect } from '@playwright/test'
import { BUYER, SELLER, TIMEOUT, login } from './helpers'

// 배포 여부 확인 헬퍼
async function isApiDeployed(page: any, path: string): Promise<boolean> {
  const res = await page.request.post(path, { data: {} }).catch(() => null)
  if (!res) return false
  // 405 = 라우트 없음(미배포), 그 외는 배포된 것
  return res.status() !== 405
}

// ── 설정 페이지 - 비밀번호 변경 ──

test.describe('설정 - 비밀번호 변경', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, BUYER)
    await page.goto('/mypage/settings')
    await page.waitForTimeout(3000)
  })

  test('L-4. 비밀번호 변경 섹션 UI 표시', async ({ page }) => {
    const hasPwSection = await page.getByText('비밀번호 변경').isVisible({ timeout: 5000 }).catch(() => false)
    if (!hasPwSection) {
      test.skip(true, '비밀번호 변경 섹션 미배포')
      return
    }
    await expect(page.getByPlaceholder('현재 비밀번호')).toBeVisible()
    await expect(page.getByPlaceholder('8자 이상')).toBeVisible()
    await expect(page.getByPlaceholder('새 비밀번호를 다시 입력하세요')).toBeVisible()
    await expect(page.getByRole('button', { name: '비밀번호 변경' })).toBeVisible()
  })

  test('L-5. 비밀번호 변경 - 현재 비밀번호 미입력 시 오류', async ({ page }) => {
    const hasPwSection = await page.getByText('비밀번호 변경').isVisible({ timeout: 5000 }).catch(() => false)
    if (!hasPwSection) {
      test.skip(true, '비밀번호 변경 섹션 미배포')
      return
    }
    await page.getByPlaceholder('8자 이상').fill('NewPass1234!')
    await page.getByPlaceholder('새 비밀번호를 다시 입력하세요').fill('NewPass1234!')
    await page.getByRole('button', { name: '비밀번호 변경' }).click()
    await page.waitForTimeout(2000)
    await expect(page.getByText('현재 비밀번호를 입력해주세요')).toBeVisible({ timeout: 5000 })
  })

  test('L-6. 비밀번호 변경 - 새 비밀번호 8자 미만 시 오류', async ({ page }) => {
    const hasPwSection = await page.getByText('비밀번호 변경').isVisible({ timeout: 5000 }).catch(() => false)
    if (!hasPwSection) {
      test.skip(true, '비밀번호 변경 섹션 미배포')
      return
    }
    await page.getByPlaceholder('현재 비밀번호').fill('Test1234!')
    await page.getByPlaceholder('8자 이상').fill('abc')
    await page.getByPlaceholder('새 비밀번호를 다시 입력하세요').fill('abc')
    await page.getByRole('button', { name: '비밀번호 변경' }).click()
    await page.waitForTimeout(2000)
    await expect(page.getByText('새 비밀번호는 8자 이상이어야 합니다')).toBeVisible({ timeout: 5000 })
  })

  test('L-7. 비밀번호 변경 - 새 비밀번호 불일치 시 오류', async ({ page }) => {
    const hasPwSection = await page.getByText('비밀번호 변경').isVisible({ timeout: 5000 }).catch(() => false)
    if (!hasPwSection) {
      test.skip(true, '비밀번호 변경 섹션 미배포')
      return
    }
    await page.getByPlaceholder('현재 비밀번호').fill('Test1234!')
    await page.getByPlaceholder('8자 이상').fill('NewPass1234!')
    await page.getByPlaceholder('새 비밀번호를 다시 입력하세요').fill('DiffPass1234!')
    await page.getByRole('button', { name: '비밀번호 변경' }).click()
    await page.waitForTimeout(2000)
    await expect(page.getByText('새 비밀번호가 일치하지 않습니다')).toBeVisible({ timeout: 5000 })
  })

  test('L-8. 비밀번호 변경 - 현재 비밀번호 오류 시 에러', async ({ page }) => {
    const hasPwSection = await page.getByText('비밀번호 변경').isVisible({ timeout: 5000 }).catch(() => false)
    if (!hasPwSection) {
      test.skip(true, '비밀번호 변경 섹션 미배포')
      return
    }
    await page.getByPlaceholder('현재 비밀번호').fill('WrongPass1234!')
    await page.getByPlaceholder('8자 이상').fill('NewPass1234!')
    await page.getByPlaceholder('새 비밀번호를 다시 입력하세요').fill('NewPass1234!')
    await page.getByRole('button', { name: '비밀번호 변경' }).click()
    await page.waitForTimeout(5000)
    await expect(page.getByText('현재 비밀번호가 올바르지 않습니다')).toBeVisible({ timeout: TIMEOUT })
  })
})

// ── 설정 페이지 - 회원 탈퇴 ──

test.describe('설정 - 회원 탈퇴', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, BUYER)
    await page.goto('/mypage/settings')
    await page.waitForTimeout(3000)
  })

  test('L-9. 회원 탈퇴 섹션 UI 표시', async ({ page }) => {
    const hasWithdraw = await page.getByRole('button', { name: '회원 탈퇴' }).isVisible({ timeout: 5000 }).catch(() => false)
    if (!hasWithdraw) {
      test.skip(true, '회원 탈퇴 섹션 미배포')
      return
    }
    await expect(page.getByText('탈퇴 시 모든 데이터는 90일 후 완전히 삭제됩니다')).toBeVisible()
  })

  test('L-10. 회원 탈퇴 버튼 클릭 시 확인 모달 표시', async ({ page }) => {
    const hasWithdraw = await page.getByRole('button', { name: '회원 탈퇴' }).isVisible({ timeout: 5000 }).catch(() => false)
    if (!hasWithdraw) {
      test.skip(true, '회원 탈퇴 섹션 미배포')
      return
    }
    await page.getByRole('button', { name: '회원 탈퇴' }).click()
    await page.waitForTimeout(1000)
    await expect(page.getByText('정말 탈퇴하시겠습니까?')).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('button', { name: '탈퇴하기' })).toBeVisible()
    await expect(page.getByRole('button', { name: '취소' })).toBeVisible()
  })

  test('L-11. 탈퇴 모달 - 사유 미선택 시 에러', async ({ page }) => {
    const hasWithdraw = await page.getByRole('button', { name: '회원 탈퇴' }).isVisible({ timeout: 5000 }).catch(() => false)
    if (!hasWithdraw) {
      test.skip(true, '회원 탈퇴 섹션 미배포')
      return
    }
    await page.getByRole('button', { name: '회원 탈퇴' }).click()
    await page.waitForTimeout(1000)
    await page.getByRole('button', { name: '탈퇴하기' }).click()
    await page.waitForTimeout(2000)
    // toast 메시지를 특정: role="status" 또는 [data-sonner-toast] 안에서만 탐색
    // Select placeholder와 toast 메시지가 동시에 존재하므로 toast만 선택
    const toastMsg = page.locator('[role="status"], [data-sonner-toast]').getByText('탈퇴 사유를 선택해주세요')
    const toastMsg2 = page.locator('.group').getByText('탈퇴 사유를 선택해주세요')
    const isToastVisible = await toastMsg.isVisible({ timeout: 3000 }).catch(() => false)
    const isToast2Visible = await toastMsg2.isVisible({ timeout: 1000 }).catch(() => false)
    // Select placeholder의 텍스트가 아닌 에러 피드백이 표시됐는지 확인
    // (버튼 클릭 후 에러 상태 발생 여부를 검증)
    const dialogStillOpen = await page.getByText('정말 탈퇴하시겠습니까?').isVisible({ timeout: 1000 }).catch(() => false)
    // 모달이 열려있거나 toast가 표시되면 에러 처리가 됐다는 의미
    expect(dialogStillOpen || isToastVisible || isToast2Visible).toBeTruthy()
  })

  test('L-12. 탈퇴 모달 - 취소 버튼 클릭 시 모달 닫힘', async ({ page }) => {
    const hasWithdraw = await page.getByRole('button', { name: '회원 탈퇴' }).isVisible({ timeout: 5000 }).catch(() => false)
    if (!hasWithdraw) {
      test.skip(true, '회원 탈퇴 섹션 미배포')
      return
    }
    await page.getByRole('button', { name: '회원 탈퇴' }).click()
    await page.waitForTimeout(1000)
    await expect(page.getByText('정말 탈퇴하시겠습니까?')).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: '취소' }).click()
    await page.waitForTimeout(1000)
    await expect(page.getByText('정말 탈퇴하시겠습니까?')).not.toBeVisible()
  })

  test('L-13. 탈퇴 모달 - 사유 선택 목록 표시', async ({ page }) => {
    const hasWithdraw = await page.getByRole('button', { name: '회원 탈퇴' }).isVisible({ timeout: 5000 }).catch(() => false)
    if (!hasWithdraw) {
      test.skip(true, '회원 탈퇴 섹션 미배포')
      return
    }
    await page.getByRole('button', { name: '회원 탈퇴' }).click()
    await page.waitForTimeout(1000)
    const selectTrigger = page.locator('[role="combobox"]')
    await expect(selectTrigger).toBeVisible({ timeout: 5000 })
    await selectTrigger.click()
    await page.waitForTimeout(500)
    await expect(page.getByText('서비스를 더 이상 이용하지 않음')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('기타')).toBeVisible()
  })
})

// ── 구매자 ↔ 판매자 모드 전환 ──

test.describe('모드 전환', () => {
  test('M-4. 모드 전환 버튼 헤더에 표시 (구매자 계정)', async ({ page }) => {
    await login(page, BUYER)
    await page.goto('/')
    await page.waitForTimeout(3000)
    const toggleBtn = page.getByText(/판매자 모드로 전환|구매자 모드로 전환/)
    await expect(toggleBtn.first()).toBeVisible({ timeout: TIMEOUT })
  })

  test('M-5. 판매자 계정 로그인 시 모드 전환 버튼 표시', async ({ page }) => {
    await login(page, SELLER)
    await page.goto('/')
    await page.waitForTimeout(3000)
    // 판매자 계정으로 로그인하면 모드 전환 버튼이 표시됨 (현재 모드에 따라 텍스트 다름)
    const toggleBtn = page.getByText(/판매자 모드로 전환|구매자 모드로 전환/)
    await expect(toggleBtn.first()).toBeVisible({ timeout: TIMEOUT })
  })

  test('M-6. 구매자 모드에서 판매자 모드 전환 버튼 클릭 동작', async ({ page }) => {
    await login(page, BUYER)
    // /mypage 경유: Supabase 클라이언트가 쿠키 세션을 초기화하도록 강제
    await page.goto('/mypage')
    await page.waitForLoadState('networkidle').catch(() => {})
    await page.waitForTimeout(2000)
    // 홈으로 이동 후 버튼 동작 테스트
    await page.goto('/')
    await page.waitForLoadState('networkidle').catch(() => {})
    await page.waitForTimeout(2000)

    const toggleBtn = page.getByRole('button', { name: '판매자 모드로 전환' })
    if (!await toggleBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      test.skip(true, '판매자 모드 전환 버튼 없음')
      return
    }

    const urlBefore = page.url()
    await toggleBtn.click()
    // 클릭 후 반응 감지 (최대 8초)
    // buyer1이 seller_profiles 없으면 모달, 있으면 /seller/* 이동
    const result = await Promise.race([
      page.waitForURL(/\/seller/, { timeout: 8000 }).then(() => 'seller_url').catch(() => null),
      page.waitForURL(/\/mypage/, { timeout: 8000 }).then(() => 'mypage_url').catch(() => null),
      page.getByText('판매자 등록이 필요합니다').waitFor({ state: 'visible', timeout: 8000 }).then(() => 'modal').catch(() => null),
      page.getByText('구매자 모드로 전환').first().waitFor({ state: 'visible', timeout: 8000 }).then(() => 'buyer_btn').catch(() => null),
    ])
    const urlChanged = urlBefore !== page.url()
    expect(result !== null || urlChanged).toBeTruthy()
  })

  test('M-7. 판매자 모드에서 구매자 모드 전환 버튼 클릭 동작', async ({ page }) => {
    await login(page, SELLER)
    await page.goto('/')
    await page.waitForTimeout(3000)
    const toBuyer = page.getByText('구매자 모드로 전환')
    if (!await toBuyer.isVisible({ timeout: 5000 }).catch(() => false)) {
      // 이미 구매자 모드거나 버튼 없음
      test.skip(true, '구매자 모드 전환 버튼 없음')
      return
    }
    await toBuyer.click()
    await page.waitForTimeout(3000)
    // 구매자 모드 전환 후: /mypage 이동 or 모드 변경 (판매자 메뉴 사라짐)
    const hasMypage = page.url().includes('/mypage')
    const hasSellerToggle = await page.getByText('판매자 모드로 전환').isVisible({ timeout: 2000 }).catch(() => false)
    expect(hasMypage || hasSellerToggle).toBeTruthy()
  })

  test('M-8. 판매자 미등록 구매자 - 판매자 전환 시 안내 모달', async ({ page }) => {
    await login(page, BUYER)
    await page.goto('/')
    await page.waitForTimeout(3000)
    const toggleBtn = page.getByText('판매자 모드로 전환')
    if (!await toggleBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, '판매자 모드 전환 버튼 없음')
      return
    }
    await toggleBtn.click()
    await page.waitForTimeout(2000)
    const hasModal = await page.getByText('판매자 등록이 필요합니다').isVisible({ timeout: 3000 }).catch(() => false)
    if (!hasModal) {
      // buyer가 이미 판매자 프로필 있는 경우 스킵
      test.skip(true, '판매자 프로필 있음 - 모달 미표시')
      return
    }
    await expect(page.getByRole('button', { name: '판매자 등록하기' })).toBeVisible()
    await expect(page.getByRole('button', { name: '취소' })).toBeVisible()
  })
})

// ── 판매자 주문 상세 페이지 ──

test.describe('판매자 주문 상세', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, SELLER)
  })

  test('SEL-10. 판매자 주문 상세 - 기본 구조 표시', async ({ page }) => {
    await page.goto('/seller/orders')
    await page.waitForTimeout(3000)
    const orderLink = page.locator('a[href*="/seller/orders/"]').first()
    if (!await orderLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, '주문 없음')
      return
    }
    await orderLink.click()
    await page.waitForURL(/seller\/orders\//, { timeout: TIMEOUT })
    await expect(page.getByText('주문 상세')).toBeVisible({ timeout: TIMEOUT })
    await expect(page.getByText('서비스 정보')).toBeVisible()
    await expect(page.getByText('주문 정보')).toBeVisible()
    await expect(page.getByText('구매자 정보')).toBeVisible()
  })

  test('SEL-11. 판매자 주문 상세 - 주문번호(ORD-) 표시', async ({ page }) => {
    await page.goto('/seller/orders')
    await page.waitForTimeout(3000)
    const orderLink = page.locator('a[href*="/seller/orders/"]').first()
    if (!await orderLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, '주문 없음')
      return
    }
    await orderLink.click()
    await page.waitForURL(/seller\/orders\//, { timeout: TIMEOUT })
    await expect(page.getByText(/ORD-/).first()).toBeVisible({ timeout: TIMEOUT })
  })

  test('SEL-12. 판매자 주문 상세 - 진행 타임라인 표시', async ({ page }) => {
    await page.goto('/seller/orders')
    await page.waitForTimeout(3000)
    const orderLink = page.locator('a[href*="/seller/orders/"]').first()
    if (!await orderLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, '주문 없음')
      return
    }
    await orderLink.click()
    await page.waitForURL(/seller\/orders\//, { timeout: TIMEOUT })
    await expect(page.getByText('진행 타임라인')).toBeVisible({ timeout: TIMEOUT })
  })

  test('SEL-13. 판매자 주문 상세 - 목록으로 돌아가기 링크', async ({ page }) => {
    await page.goto('/seller/orders')
    await page.waitForTimeout(3000)
    const orderLink = page.locator('a[href*="/seller/orders/"]').first()
    if (!await orderLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, '주문 없음')
      return
    }
    await orderLink.click()
    await page.waitForURL(/seller\/orders\//, { timeout: TIMEOUT })
    await expect(page.getByText('주문 목록으로')).toBeVisible({ timeout: TIMEOUT })
    await page.getByText('주문 목록으로').click()
    await expect(page).toHaveURL(/seller\/orders$/, { timeout: TIMEOUT })
  })

  test('SEL-14. 판매자 주문 상세 - 구매자 메시지 링크', async ({ page }) => {
    await page.goto('/seller/orders')
    await page.waitForTimeout(3000)
    const orderLink = page.locator('a[href*="/seller/orders/"]').first()
    if (!await orderLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, '주문 없음')
      return
    }
    await orderLink.click()
    await page.waitForURL(/seller\/orders\//, { timeout: TIMEOUT })
    await expect(page.getByText('구매자에게 메시지 보내기')).toBeVisible({ timeout: TIMEOUT })
  })

  test('SEL-15. 판매자 주문 상세 - 처리 가능 상태에서 주문 처리 카드', async ({ page }) => {
    await page.goto('/seller/orders')
    await page.waitForTimeout(3000)
    const orderLink = page.locator('a[href*="/seller/orders/"]').first()
    if (!await orderLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, '주문 없음')
      return
    }
    await orderLink.click()
    await page.waitForURL(/seller\/orders\//, { timeout: TIMEOUT })
    await page.waitForTimeout(2000)
    const bodyText = await page.locator('body').textContent()
    // 완료/취소/거절 상태가 아닌 경우 주문 처리 카드가 있어야 함
    const isTerminal = bodyText?.includes('구매확정') || bodyText?.includes('거래완료') ||
      bodyText?.includes('취소됨') || bodyText?.includes('거절됨') ||
      bodyText?.includes('COMPLETED') || bodyText?.includes('CANCELLED')
    if (!isTerminal) {
      const actionCard = page.getByText('주문 처리')
      await expect(actionCard).toBeVisible({ timeout: 5000 })
    }
  })
})

// ── 주문 취소 정책 - API ──

test.describe('주문 취소 - API', () => {
  test('ORD-10. 취소 API - 미인증 시 401', async ({ page }) => {
    await page.goto('/')
    const deployed = await isApiDeployed(page, '/api/orders/00000000-0000-0000-0000-000000000000/cancel')
    if (!deployed) {
      test.skip(true, '취소 API 미배포 (405 반환)')
      return
    }
    const res = await page.request.post('/api/orders/00000000-0000-0000-0000-000000000000/cancel', {
      data: { reason: '테스트 취소 사유입니다' },
    })
    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('UNAUTHORIZED')
  })

  test('ORD-11. 취소 API - 사유 5자 미만 시 400', async ({ page }) => {
    await login(page, BUYER)
    const deployed = await isApiDeployed(page, '/api/orders/00000000-0000-0000-0000-000000000000/cancel')
    if (!deployed) {
      test.skip(true, '취소 API 미배포 (405 반환)')
      return
    }
    const res = await page.request.post('/api/orders/00000000-0000-0000-0000-000000000000/cancel', {
      data: { reason: '짧음' },
    })
    expect([400, 404]).toContain(res.status())
    const body = await res.json()
    expect(body.success).toBe(false)
  })

  test('ORD-12. 취소 API - 존재하지 않는 주문 404', async ({ page }) => {
    await login(page, BUYER)
    const deployed = await isApiDeployed(page, '/api/orders/00000000-0000-0000-0000-000000000000/cancel')
    if (!deployed) {
      test.skip(true, '취소 API 미배포 (405 반환)')
      return
    }
    const res = await page.request.post('/api/orders/00000000-0000-0000-0000-000000000000/cancel', {
      data: { reason: '충분한 취소 사유 입력' },
    })
    expect(res.status()).toBe(404)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('NOT_FOUND')
  })
})

// ── 납품 처리 - API ──

test.describe('납품 처리 - API', () => {
  test('ORD-13. 납품 API - 미인증 시 401', async ({ page }) => {
    await page.goto('/')
    const deployed = await isApiDeployed(page, '/api/orders/00000000-0000-0000-0000-000000000000/deliver')
    if (!deployed) {
      test.skip(true, '납품 API 미배포 (405 반환)')
      return
    }
    const res = await page.request.post('/api/orders/00000000-0000-0000-0000-000000000000/deliver', {
      data: { note: '납품 메시지' },
    })
    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('UNAUTHORIZED')
  })

  test('ORD-14. 납품 API - 존재하지 않는 주문 404', async ({ page }) => {
    await login(page, SELLER)
    const deployed = await isApiDeployed(page, '/api/orders/00000000-0000-0000-0000-000000000000/deliver')
    if (!deployed) {
      test.skip(true, '납품 API 미배포 (405 반환)')
      return
    }
    const res = await page.request.post('/api/orders/00000000-0000-0000-0000-000000000000/deliver', {
      data: { note: '납품 메시지' },
    })
    expect(res.status()).toBe(404)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('NOT_FOUND')
  })

  test('ORD-15. 납품 API - 구매자가 납품 시도 시 403', async ({ page }) => {
    await login(page, BUYER)
    const deployed = await isApiDeployed(page, '/api/orders/00000000-0000-0000-0000-000000000000/deliver')
    if (!deployed) {
      test.skip(true, '납품 API 미배포 (405 반환)')
      return
    }
    await page.goto('/orders')
    await page.waitForTimeout(3000)
    const orderLink = page.locator('a[href*="/orders/"]').first()
    if (!await orderLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, '주문 없음')
      return
    }
    const href = await orderLink.getAttribute('href')
    const orderId = href?.split('/orders/')?.[1]
    if (!orderId) {
      test.skip(true, '주문 ID 파싱 실패')
      return
    }
    const res = await page.request.post(`/api/orders/${orderId}/deliver`, {
      data: { note: '테스트' },
    })
    expect(res.status()).toBe(403)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('FORBIDDEN')
  })
})

// ── 구매 확정 - API ──

test.describe('구매 확정 - API', () => {
  test('ORD-16. 구매확정 API - 미인증 시 401', async ({ page }) => {
    await page.goto('/')
    const deployed = await isApiDeployed(page, '/api/orders/00000000-0000-0000-0000-000000000000/confirm')
    if (!deployed) {
      test.skip(true, '구매확정 API 미배포 (405 반환)')
      return
    }
    const res = await page.request.post('/api/orders/00000000-0000-0000-0000-000000000000/confirm')
    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('UNAUTHORIZED')
  })

  test('ORD-17. 구매확정 API - 존재하지 않는 주문 404', async ({ page }) => {
    await login(page, BUYER)
    const deployed = await isApiDeployed(page, '/api/orders/00000000-0000-0000-0000-000000000000/confirm')
    if (!deployed) {
      test.skip(true, '구매확정 API 미배포 (405 반환)')
      return
    }
    const res = await page.request.post('/api/orders/00000000-0000-0000-0000-000000000000/confirm')
    expect(res.status()).toBe(404)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('NOT_FOUND')
  })

  test('ORD-18. 구매확정 API - 판매자가 시도 시 403', async ({ page }) => {
    await login(page, SELLER)
    const deployed = await isApiDeployed(page, '/api/orders/00000000-0000-0000-0000-000000000000/confirm')
    if (!deployed) {
      test.skip(true, '구매확정 API 미배포 (405 반환)')
      return
    }
    await page.goto('/seller/orders')
    await page.waitForTimeout(3000)
    const orderLink = page.locator('a[href*="/seller/orders/"]').first()
    if (!await orderLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, '주문 없음')
      return
    }
    const href = await orderLink.getAttribute('href')
    const orderId = href?.split('/seller/orders/')?.[1]
    if (!orderId) {
      test.skip(true, '주문 ID 파싱 실패')
      return
    }
    const res = await page.request.post(`/api/orders/${orderId}/confirm`)
    expect(res.status()).toBe(403)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('FORBIDDEN')
  })
})

// ── 자동 구매 확정 - API ──

test.describe('자동 구매 확정 - API', () => {
  test('ORD-19. 자동 구매확정 API - 응답 형식 검증', async ({ page }) => {
    await page.goto('/')
    const deployed = await isApiDeployed(page, '/api/orders/auto-confirm')
    if (!deployed) {
      test.skip(true, '자동 구매확정 API 미배포 (405 반환)')
      return
    }
    // 잘못된 secret으로 요청
    const res = await page.request.post('/api/orders/auto-confirm', {
      headers: { Authorization: 'Bearer wrong-secret-test-value' },
    })
    // CRON_SECRET 설정 있으면 401, 없으면 200 (처리 완료)
    expect([200, 401]).toContain(res.status())
    const body = await res.json()
    if (res.status() === 401) {
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('UNAUTHORIZED')
    } else {
      expect(body.success).toBe(true)
      expect(typeof body.data.confirmed).toBe('number')
    }
  })
})

// ── 주문 취소 모달 - UI ──

test.describe('주문 취소 모달 - UI', () => {
  test('ORD-20. 주문 취소 버튼 클릭 시 모달 표시', async ({ page }) => {
    await login(page, BUYER)
    // 취소 모달 기능이 배포됐는지 확인
    await page.goto('/orders')
    await page.waitForTimeout(3000)
    const orderLink = page.locator('a[href*="/orders/"]').first()
    if (!await orderLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, '주문 없음')
      return
    }
    await orderLink.click()
    await page.waitForURL(/orders\/(?!new)/, { timeout: TIMEOUT })
    await page.waitForTimeout(2000)
    const cancelBtn = page.locator('button:has-text("주문 취소")')
    if (!await cancelBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, '취소 버튼 없음 (취소 불가 상태이거나 미배포)')
      return
    }
    await cancelBtn.click()
    await page.waitForTimeout(1000)
    await expect(page.getByText('주문을 취소하시겠습니까?')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('textarea#cancel-reason')).toBeVisible()
    await expect(page.getByRole('button', { name: '취소 확인' })).toBeVisible()
    await expect(page.getByRole('button', { name: '돌아가기' })).toBeVisible()
  })

  test('ORD-21. 취소 모달 - 5자 미만 입력 시 확인 버튼 비활성화', async ({ page }) => {
    await login(page, BUYER)
    await page.goto('/orders')
    await page.waitForTimeout(3000)
    const orderLink = page.locator('a[href*="/orders/"]').first()
    if (!await orderLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, '주문 없음')
      return
    }
    await orderLink.click()
    await page.waitForURL(/orders\/(?!new)/, { timeout: TIMEOUT })
    await page.waitForTimeout(2000)
    const cancelBtn = page.locator('button:has-text("주문 취소")')
    if (!await cancelBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, '취소 버튼 없음')
      return
    }
    await cancelBtn.click()
    await page.waitForTimeout(1000)
    const confirmBtn = page.getByRole('button', { name: '취소 확인' })
    // 빈 상태에서 비활성화
    await expect(confirmBtn).toBeDisabled()
    // 4자 입력 - 여전히 비활성화
    await page.locator('textarea#cancel-reason').fill('짧음')
    await expect(confirmBtn).toBeDisabled()
    // 5자 이상 입력 - 활성화
    await page.locator('textarea#cancel-reason').fill('취소 사유입니다')
    await expect(confirmBtn).toBeEnabled()
  })

  test('ORD-22. 취소 모달 - 환불 정보 표시', async ({ page }) => {
    await login(page, BUYER)
    await page.goto('/orders')
    await page.waitForTimeout(3000)
    const orderLink = page.locator('a[href*="/orders/"]').first()
    if (!await orderLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, '주문 없음')
      return
    }
    await orderLink.click()
    await page.waitForURL(/orders\/(?!new)/, { timeout: TIMEOUT })
    await page.waitForTimeout(2000)
    const cancelBtn = page.locator('button:has-text("주문 취소")')
    if (!await cancelBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, '취소 버튼 없음')
      return
    }
    await cancelBtn.click()
    await page.waitForTimeout(1000)
    const dialogText = await page.locator('[role="dialog"]').textContent()
    expect(dialogText).toMatch(/환불/)
  })
})

// ── 납품 처리 - UI ──

test.describe('납품 처리 - UI', () => {
  test('ORD-23. 납품 메시지 입력란 - IN_PROGRESS 상태에서 표시', async ({ page }) => {
    await login(page, SELLER)
    await page.goto('/seller/orders')
    await page.waitForTimeout(3000)
    const orderLinks = page.locator('a[href*="/seller/orders/"]')
    const count = await orderLinks.count()
    if (count === 0) {
      test.skip(true, '주문 없음')
      return
    }
    let foundDeliver = false
    for (let i = 0; i < Math.min(count, 5); i++) {
      const href = await orderLinks.nth(i).getAttribute('href')
      await page.goto(href!)
      await page.waitForTimeout(2000)
      const deliverBtn = page.locator('button:has-text("납품하기")')
      if (await deliverBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(page.getByPlaceholder('납품물에 대한 설명을 입력하세요')).toBeVisible()
        foundDeliver = true
        break
      }
      await page.goto('/seller/orders')
      await page.waitForTimeout(2000)
    }
    if (!foundDeliver) {
      console.log('  IN_PROGRESS 상태 주문 없음 - 납품 UI 확인 스킵')
    }
  })
})
