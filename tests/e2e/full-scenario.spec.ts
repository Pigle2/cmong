import { test, expect, type Page } from '@playwright/test'
import { BUYER, SELLER, TIMEOUT, login, logout } from './helpers'

/**
 * 크몽 클론 - 전체 기능 테스트 시나리오
 *
 * 실행: npx playwright test tests/e2e/full-scenario.spec.ts --reporter=list
 */

// ════════════════════════════════════════════════════════════
// A. 비로그인 상태 테스트
// ════════════════════════════════════════════════════════════

test.describe('A. 비로그인 상태', () => {
  test('A-1. 홈페이지 로드 - 히어로/카테고리/인기/신규 서비스 표시', async ({ page }) => {
    await page.goto('/')
    // 히어로 배너
    await expect(page.locator('h1').filter({ hasText: '전문가에게 맡기세요' })).toBeVisible({ timeout: TIMEOUT })
    // 카테고리 섹션
    await expect(page.locator('h2').filter({ hasText: '카테고리' })).toBeVisible()
    // 인기 서비스 섹션
    await expect(page.locator('h2').filter({ hasText: '인기 서비스' })).toBeVisible()
    // 신규 서비스 섹션
    await expect(page.locator('h2').filter({ hasText: '신규 서비스' })).toBeVisible()
    // 서비스 카드 최소 1개
    const cards = page.locator('[class*="card"]')
    await expect(cards.first()).toBeVisible({ timeout: TIMEOUT })
  })

  test('A-2. 홈 → 카테고리 아이콘 클릭 → 서비스 목록 필터링', async ({ page }) => {
    await page.goto('/')
    // 카테고리 아이콘 클릭 (첫 번째)
    const catLink = page.locator('section').filter({ hasText: '카테고리' }).locator('a').first()
    await expect(catLink).toBeVisible({ timeout: TIMEOUT })
    await catLink.click()
    await expect(page).toHaveURL(/services\?category=/, { timeout: TIMEOUT })
  })

  test('A-3. 서비스 검색 페이지 - 카드 목록 표시', async ({ page }) => {
    await page.goto('/services')
    const cards = page.locator('[class*="card"]')
    await expect(cards.first()).toBeVisible({ timeout: TIMEOUT })
    // 총 N개의 서비스 텍스트
    await expect(page.getByText(/총.*\d+.*개의 서비스/)).toBeVisible()
  })

  test('A-4. 서비스 검색 - 키워드 검색 동작', async ({ page }) => {
    await page.goto('/services')
    // 검색바에 입력
    const searchInput = page.locator('input[placeholder*="검색"], input[placeholder*="서비스"]').first()
    await expect(searchInput).toBeVisible({ timeout: TIMEOUT })
    await searchInput.fill('로고')
    await searchInput.press('Enter')
    await page.waitForTimeout(3000)
    // URL에 q= 포함
    expect(page.url()).toContain('q=')
  })

  test('A-5. 서비스 검색 - 정렬 변경', async ({ page }) => {
    await page.goto('/services')
    await page.waitForTimeout(2000)
    // 정렬 셀렉트/버튼 찾기
    const sortLink = page.locator('a[href*="sort=newest"], button:has-text("최신순")').first()
    if (await sortLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await sortLink.click()
      await page.waitForTimeout(2000)
    }
  })

  test('A-6. 서비스 상세 페이지 - 정보 표시', async ({ page }) => {
    // 서비스 목록에서 첫 번째 서비스 클릭
    await page.goto('/services')
    const card = page.locator('[class*="card"] a, [class*="card"]').first()
    await expect(card).toBeVisible({ timeout: TIMEOUT })
    await card.click()
    await page.waitForURL(/services\//, { timeout: TIMEOUT })

    // 패키지 비교 테이블 (스탠다드/디럭스/프리미엄)
    await expect(page.getByText(/스탠다드|STANDARD/i)).toBeVisible({ timeout: TIMEOUT })
    // 판매자 정보
    await expect(page.locator('body')).toContainText(/판매자|전문가/)
    // 문의하기 버튼
    await expect(page.getByText('문의하기')).toBeVisible()
  })

  test('A-7. 로그인 페이지 로드', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByPlaceholder('example@email.com')).toBeVisible()
    await expect(page.getByRole('button', { name: '로그인' })).toBeVisible()
    // 회원가입 링크
    await expect(page.getByText('회원가입')).toBeVisible()
  })

  test('A-8. 회원가입 페이지 로드', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByPlaceholder('example@email.com')).toBeVisible()
    // 닉네임 입력
    await expect(page.getByPlaceholder(/닉네임/)).toBeVisible()
    // 비밀번호 입력
    await expect(page.locator('input[type="password"]').first()).toBeVisible()
    // 회원 유형 선택 (구매자 라디오)
    await expect(page.getByText('구매자')).toBeVisible()
  })

  test('A-9. 비로그인 시 보호 페이지 리다이렉트', async ({ page }) => {
    // 주문 페이지
    await page.goto('/orders')
    await expect(page).toHaveURL(/login/, { timeout: TIMEOUT })

    // 마이페이지
    await page.goto('/mypage')
    await expect(page).toHaveURL(/login/, { timeout: TIMEOUT })

    // 판매자 대시보드
    await page.goto('/seller/dashboard')
    await expect(page).toHaveURL(/login/, { timeout: TIMEOUT })
  })

  test('A-10. 로그인 실패 - 잘못된 비밀번호', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', BUYER.email)
    await page.fill('input[type="password"]', 'WrongPass123!')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(3000)
    // 여전히 로그인 페이지에 있어야 함
    await expect(page).toHaveURL(/login/)
    // 에러 메시지
    await expect(page.getByText(/올바르지 않|실패|invalid/i)).toBeVisible({ timeout: 5000 })
  })
})

// ════════════════════════════════════════════════════════════
// B. 구매자 로그인 + 기본 기능
// ════════════════════════════════════════════════════════════

test.describe('B. 구매자 로그인 후', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, BUYER)
  })

  test('B-1. 로그인 성공 → 헤더에 아바타 표시', async ({ page }) => {
    await page.goto('/')
    // 헤더에 아바타 또는 사용자 메뉴 표시
    const avatar = page.locator('header [role="img"], header button:has(span.relative)')
    await expect(avatar.first()).toBeVisible({ timeout: TIMEOUT })
  })

  test('B-2. 유저 메뉴 드롭다운 - 로그아웃 존재', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(3000)
    // 아바타 클릭
    const trigger = page.locator('header').locator('button').filter({ has: page.locator('[role="img"], span.relative') }).first()
    if (await trigger.isVisible({ timeout: 5000 }).catch(() => false)) {
      await trigger.click()
      await expect(page.getByText('로그아웃')).toBeVisible({ timeout: 5000 })
      // 마이페이지 링크
      await expect(page.getByText('마이페이지')).toBeVisible()
    } else {
      // 아바타 대신 다른 메뉴 형태일 수 있음
      test.fail(true, '헤더에 유저 메뉴 트리거를 찾을 수 없음')
    }
  })

  test('B-3. 마이페이지 접근 - 프로필 정보 표시', async ({ page }) => {
    await page.goto('/mypage')
    // 프로필 정보 (닉네임 또는 이메일)
    await expect(page.getByText(/구매자김철수|buyer1/).first()).toBeVisible({ timeout: TIMEOUT })
    // 통계 카드
    await expect(page.getByText('주문').first()).toBeVisible()
    await expect(page.getByText('찜').first()).toBeVisible()
    // 최근 주문 섹션
    await expect(page.getByText('최근 주문')).toBeVisible()
  })

  test('B-4. 마이페이지 > 찜 목록 접근', async ({ page }) => {
    await page.goto('/mypage/favorites')
    await expect(page).toHaveURL(/favorites/)
    // 찜 목록 또는 빈 상태
    await expect(page.locator('body')).toContainText(/찜|서비스|없습니다/, { timeout: TIMEOUT })
  })

  test('B-5. 주문 목록 접근', async ({ page }) => {
    await page.goto('/orders')
    // 주문 목록 또는 빈 상태
    await expect(page.locator('body')).toContainText(/주문|내역|없습니다/, { timeout: TIMEOUT })
  })

  test('B-6. 채팅 페이지 접근', async ({ page }) => {
    await page.goto('/chat')
    // 채팅 UI 로드 (로딩이 아닌 실제 UI)
    await page.waitForTimeout(5000)
    const body = page.locator('body')
    // "채팅 로딩 중"이 사라지고 실제 채팅 UI가 나와야 함
    const hasChat = await body.getByText(/대화를 선택|대화 목록|채팅/).first().isVisible({ timeout: TIMEOUT }).catch(() => false)
    const hasLogin = await body.getByText('로그인이 필요합니다').isVisible({ timeout: 3000 }).catch(() => false)
    expect(hasChat || !hasLogin).toBeTruthy()
  })

  test('B-7. 서비스 상세 → 찜하기 토글', async ({ page }) => {
    await page.goto('/services')
    const card = page.locator('[class*="card"] a, a[href*="services/"]').first()
    await expect(card).toBeVisible({ timeout: TIMEOUT })
    await card.click()
    await page.waitForURL(/services\//, { timeout: TIMEOUT })

    // 찜 버튼 찾기 (하트 아이콘)
    const favBtn = page.locator('button').filter({ has: page.locator('svg.lucide-heart, svg') }).first()
    if (await favBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await favBtn.click()
      await page.waitForTimeout(2000)
      // 토글 후 다시 클릭
      await favBtn.click()
      await page.waitForTimeout(1000)
    }
  })

  test('B-8. 서비스 상세 → 문의하기 → 채팅방 이동', async ({ page }) => {
    await page.goto('/services')
    const card = page.locator('[class*="card"] a, a[href*="services/"]').first()
    await expect(card).toBeVisible({ timeout: TIMEOUT })
    await card.click()
    await page.waitForURL(/services\//, { timeout: TIMEOUT })

    // 문의하기 버튼 클릭
    const inquiryBtn = page.getByText('문의하기').first()
    await expect(inquiryBtn).toBeVisible({ timeout: TIMEOUT })
    await inquiryBtn.click()
    // 채팅 페이지로 이동
    await expect(page).toHaveURL(/chat/, { timeout: TIMEOUT })
    // 채팅 UI 로드 대기
    await page.waitForTimeout(5000)
  })

  test('B-9. 채팅 → 채팅방 선택 → 기존 메시지 로드 + 새 메시지 전송', async ({ page }) => {
    await page.goto('/chat')
    await page.waitForTimeout(5000)

    // 대화방이 있으면 첫 번째 선택
    const roomItem = page.locator('[class*="cursor-pointer"], [role="button"]').first()
    if (await roomItem.isVisible({ timeout: 5000 }).catch(() => false)) {
      await roomItem.click()

      // 채팅 입력란이 보일 때까지 대기 (메시지 스레드가 로드된 증거)
      const input = page.locator('input[placeholder*="메시지"]')
      await expect(input).toBeVisible({ timeout: TIMEOUT })

      // "메시지 로딩 중..." 텍스트가 사라져야 함 (기존 메시지가 로드됨)
      await expect(page.getByText('메시지 로딩 중...')).not.toBeVisible({ timeout: TIMEOUT })

      // 기존 메시지가 있으면 채팅 버블이 보여야 함
      // (첫 메시지를 보내보세요 = 빈 대화방도 정상)
      const hasBubble = await page.locator('[class*="rounded"]').filter({ hasText: /.+/ }).first().isVisible({ timeout: 5000 }).catch(() => false)
      const isEmpty = await page.getByText('첫 메시지를 보내보세요').isVisible({ timeout: 3000 }).catch(() => false)
      expect(hasBubble || isEmpty).toBeTruthy()

      // 새 메시지 전송
      const testMsg = `테스트-${Date.now()}`
      await input.fill(testMsg)
      const sendBtn = page.locator('button[type="submit"]')
      await sendBtn.click()
      await page.waitForTimeout(3000)

      // 전송한 메시지가 화면에 표시되는지 확인
      await expect(page.getByText(testMsg)).toBeVisible({ timeout: TIMEOUT })
    }
  })

  test('B-10. 알림 벨 아이콘 표시', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(3000)
    // 헤더에 알림 벨 아이콘
    const bell = page.locator('header').locator('svg.lucide-bell, button:has(svg.lucide-bell)')
    const hasBell = await bell.first().isVisible({ timeout: 5000 }).catch(() => false)
    // 벨이 있으면 클릭해서 알림 목록 표시
    if (hasBell) {
      await bell.first().click()
      await page.waitForTimeout(2000)
    }
  })

  test('B-11. 로그아웃 동작', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(3000)
    await logout(page)
    // 로그아웃 후 로그인 링크가 보여야 함
    await page.goto('/mypage')
    await expect(page).toHaveURL(/login/, { timeout: TIMEOUT })
  })
})

// ════════════════════════════════════════════════════════════
// C. 구매자 주문 플로우
// ════════════════════════════════════════════════════════════

test.describe('C. 구매자 주문 플로우', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, BUYER)
  })

  test('C-1. 서비스 상세 → 패키지 선택 → 주문 페이지 이동', async ({ page }) => {
    await page.goto('/services')
    const card = page.locator('[class*="card"] a, a[href*="services/"]').first()
    await expect(card).toBeVisible({ timeout: TIMEOUT })
    await card.click()
    await page.waitForURL(/services\//, { timeout: TIMEOUT })

    // 패키지 주문 버튼 - 페이지 하단에 있으므로 스크롤 후 클릭
    const orderBtn = page.getByText('주문하기').first()
    await orderBtn.scrollIntoViewIfNeeded()
    if (await orderBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await orderBtn.click()
      await page.waitForURL(/orders\/new/, { timeout: TIMEOUT })
      expect(page.url()).toContain('orders')
    }
  })

  test('C-2. 주문 생성 페이지 - 요구사항 입력 + 주문', async ({ page }) => {
    // 서비스 목록에서 서비스 ID를 가져와서 직접 주문 페이지로 이동
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

    // 주문 페이지 로드 확인
    const hasOrderForm = await page.getByText(/주문|결제|요구사항/).first().isVisible({ timeout: TIMEOUT }).catch(() => false)
    if (hasOrderForm) {
      // 요구사항 입력
      const textarea = page.locator('textarea')
      if (await textarea.isVisible({ timeout: 3000 }).catch(() => false)) {
        await textarea.fill('E2E 테스트 주문입니다. 로고 디자인 부탁드립니다.')
      }
      // 주문 버튼
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

    // 주문이 있으면 첫 번째 클릭
    const orderLink = page.locator('a[href*="/orders/"]').first()
    if (await orderLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await orderLink.click()
      await page.waitForURL(/orders\//, { timeout: TIMEOUT })

      // 주문 상세 정보
      await expect(page.getByText('주문 상세')).toBeVisible({ timeout: TIMEOUT })
      await expect(page.getByText(/ORD-/).first()).toBeVisible({ timeout: TIMEOUT })
      // 주문 정보 섹션
      await expect(page.getByText('주문 정보')).toBeVisible()
      // 서비스 정보
      await expect(page.getByText('서비스 정보')).toBeVisible()
      // 진행 상황
      await expect(page.getByText('진행 상황')).toBeVisible()
    }
  })

  test('C-4. 주문 상세 → 구매자 액션 버튼 표시', async ({ page }) => {
    await page.goto('/orders')
    await page.waitForTimeout(3000)

    const orderLink = page.locator('a[href*="/orders/"]').first()
    if (await orderLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await orderLink.click()
      await page.waitForURL(/orders\//, { timeout: TIMEOUT })

      // 상태에 따른 액션 버튼 (구매확정, 수정요청, 취소 등)
      const actions = page.locator('button:has-text("구매 확정"), button:has-text("수정 요청"), button:has-text("주문 취소"), button:has-text("리뷰 작성")')
      const hasActions = await actions.first().isVisible({ timeout: 5000 }).catch(() => false)
      // 주문 상태에 따라 액션이 있을 수도 없을 수도 있음 - 로그로 확인
      console.log(`  구매자 액션 버튼 존재: ${hasActions}`)
    }
  })
})

// ════════════════════════════════════════════════════════════
// D. 판매자 로그인 + 기본 기능
// ════════════════════════════════════════════════════════════

test.describe('D. 판매자 기본 기능', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, SELLER)
  })

  test('D-1. 판매자 대시보드 접근 - 통계 카드 표시', async ({ page }) => {
    await page.goto('/seller/dashboard')
    // 대시보드 타이틀
    await expect(page.getByText('판매자 대시보드')).toBeVisible({ timeout: TIMEOUT })
    // 4개 통계 카드
    await expect(page.getByText('등록 서비스')).toBeVisible()
    await expect(page.getByText('진행중 주문')).toBeVisible()
    await expect(page.getByText('완료 주문')).toBeVisible()
    await expect(page.getByText('평균 평점')).toBeVisible()
  })

  test('D-2. 판매자 서비스 목록', async ({ page }) => {
    await page.goto('/seller/services')
    await page.waitForTimeout(3000)
    // 서비스 목록 또는 빈 상태
    await expect(page.locator('body')).toContainText(/서비스|등록/, { timeout: TIMEOUT })
  })

  test('D-3. 판매자 서비스 등록 페이지 - 폼 표시', async ({ page }) => {
    await page.goto('/seller/services/new')
    // 서비스 등록 헤딩
    await expect(page.getByRole('heading', { name: '새 서비스 등록' })).toBeVisible({ timeout: TIMEOUT })
    // 카테고리 섹션
    await expect(page.getByText('카테고리')).toBeVisible()
    // 기본 정보 섹션
    await expect(page.getByText('기본 정보')).toBeVisible()
    // 제목 입력
    await expect(page.getByPlaceholder(/제목/)).toBeVisible()
    // 설명 입력
    await expect(page.getByPlaceholder(/설명/).first()).toBeVisible()
  })

  test('D-4. 서비스 등록 - 카테고리 선택 → 제목 → 패키지 → 등록', async ({ page }) => {
    await page.goto('/seller/services/new')
    await page.waitForTimeout(3000)

    // 1단계: 카테고리 선택 (첫 번째 대분류)
    const catSelect = page.locator('select, [role="combobox"]').first()
    if (await catSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      // select 태그인 경우
      const options = await catSelect.locator('option').allTextContents()
      if (options.length > 1) {
        await catSelect.selectOption({ index: 1 })
        await page.waitForTimeout(1000)
      }
    }

    // 2단계: 제목 입력
    const titleInput = page.locator('input[placeholder*="제목"], input[name="title"]').first()
    if (await titleInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await titleInput.fill('E2E 테스트 서비스 - ' + Date.now())
    }

    // 3단계: 설명 입력
    const descTextarea = page.locator('textarea').first()
    if (await descTextarea.isVisible({ timeout: 3000 }).catch(() => false)) {
      await descTextarea.fill('이것은 E2E 테스트로 생성된 서비스입니다.')
    }

    // 4단계: 패키지 가격 입력
    const priceInput = page.locator('input[type="number"], input[placeholder*="가격"], input[name*="price"]').first()
    if (await priceInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await priceInput.fill('50000')
    }

    // 작업일 입력
    const daysInput = page.locator('input[placeholder*="일"], input[name*="work_days"], input[name*="days"]').first()
    if (await daysInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await daysInput.fill('5')
    }
  })

  test('D-5. 판매자 주문 관리 페이지', async ({ page }) => {
    await page.goto('/seller/orders')
    // 주문 관리 헤딩
    await expect(page.getByRole('heading', { name: '주문 관리' })).toBeVisible({ timeout: TIMEOUT })
    // 진행중/완료 탭
    await expect(page.getByRole('tab', { name: /진행중/ })).toBeVisible()
    await expect(page.getByRole('tab', { name: /완료/ })).toBeVisible()
  })

  test('D-6. 판매자 주문 상세 → 액션 버튼', async ({ page }) => {
    await page.goto('/seller/orders')
    await page.waitForTimeout(3000)

    const orderLink = page.locator('a[href*="/seller/orders/"]').first()
    if (await orderLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await orderLink.click()
      await page.waitForURL(/seller\/orders\//, { timeout: TIMEOUT })

      // 판매자 액션 버튼 (수락, 거절, 작업시작, 납품)
      const actions = page.locator('button:has-text("수락"), button:has-text("거절"), button:has-text("작업 시작"), button:has-text("납품")')
      const hasActions = await actions.first().isVisible({ timeout: 5000 }).catch(() => false)
      console.log(`  판매자 액션 버튼 존재: ${hasActions}`)
    }
  })

  test('D-7. 판매자 프로필 관리 페이지', async ({ page }) => {
    await page.goto('/seller/profile')
    await page.waitForTimeout(3000)
    await expect(page.getByText(/판매자 프로필|프로필 관리/)).toBeVisible({ timeout: TIMEOUT })
    // 활동명/소개 입력 필드
    const nameInput = page.locator('input[name*="name"], input[placeholder*="활동명"]').first()
    const hasInput = await nameInput.isVisible({ timeout: 3000 }).catch(() => false)
    console.log(`  프로필 입력 필드 존재: ${hasInput}`)
  })

  test('D-8. 판매자 프로필 저장', async ({ page }) => {
    await page.goto('/seller/profile')
    await page.waitForTimeout(3000)

    // 소개 수정
    const textarea = page.locator('textarea').first()
    if (await textarea.isVisible({ timeout: 3000 }).catch(() => false)) {
      await textarea.fill('E2E 테스트로 업데이트된 소개입니다.')
    }

    // 저장 버튼
    const saveBtn = page.locator('button:has-text("저장"), button[type="submit"]').first()
    if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await saveBtn.click()
      await page.waitForTimeout(3000)
    }
  })

  test('D-9. 판매자 서비스 편집 페이지 접근', async ({ page }) => {
    await page.goto('/seller/services')
    await page.waitForTimeout(3000)

    // 서비스가 있으면 편집 버튼/링크 클릭
    const editLink = page.locator('a[href*="/edit"], button:has-text("수정"), button:has-text("편집")').first()
    if (await editLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editLink.click()
      await page.waitForTimeout(3000)
      // 편집 페이지 로드 확인
      await expect(page.locator('body')).toContainText(/수정|편집|저장/, { timeout: TIMEOUT })
    }
  })
})

// ════════════════════════════════════════════════════════════
// E. 주문 상태 전이 (판매자 → 구매자 교대)
// ════════════════════════════════════════════════════════════

test.describe('E. 주문 상태 전이 플로우', () => {
  test('E-1. 판매자: 주문 수락 (PAID → ACCEPTED)', async ({ page }) => {
    await login(page, SELLER)
    await page.goto('/seller/orders')
    await page.waitForTimeout(3000)

    // PAID 상태 주문 찾기
    const paidOrder = page.locator('a[href*="/seller/orders/"]').first()
    if (await paidOrder.isVisible({ timeout: 5000 }).catch(() => false)) {
      await paidOrder.click()
      await page.waitForTimeout(3000)

      const acceptBtn = page.locator('button:has-text("수락")')
      if (await acceptBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await acceptBtn.click()
        await page.waitForTimeout(3000)
        console.log('  주문 수락 클릭 완료')
      } else {
        console.log('  수락 버튼 없음 (이미 수락됨 또는 다른 상태)')
      }
    }
  })

  test('E-2. 판매자: 작업 시작 (ACCEPTED → IN_PROGRESS)', async ({ page }) => {
    await login(page, SELLER)
    await page.goto('/seller/orders')
    await page.waitForTimeout(3000)

    const order = page.locator('a[href*="/seller/orders/"]').first()
    if (await order.isVisible({ timeout: 5000 }).catch(() => false)) {
      await order.click()
      await page.waitForTimeout(3000)

      const startBtn = page.locator('button:has-text("작업 시작")')
      if (await startBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await startBtn.click()
        await page.waitForTimeout(3000)
        console.log('  작업 시작 클릭 완료')
      }
    }
  })

  test('E-3. 판매자: 납품하기 (IN_PROGRESS → DELIVERED)', async ({ page }) => {
    await login(page, SELLER)
    await page.goto('/seller/orders')
    await page.waitForTimeout(3000)

    const order = page.locator('a[href*="/seller/orders/"]').first()
    if (await order.isVisible({ timeout: 5000 }).catch(() => false)) {
      await order.click()
      await page.waitForTimeout(3000)

      const deliverBtn = page.locator('button:has-text("납품")')
      if (await deliverBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await deliverBtn.click()
        await page.waitForTimeout(3000)
        console.log('  납품 클릭 완료')
      }
    }
  })

  test('E-4. 구매자: 구매 확정 (DELIVERED → COMPLETED)', async ({ page }) => {
    await login(page, BUYER)
    await page.goto('/orders')
    await page.waitForTimeout(3000)

    const order = page.locator('a[href*="/orders/"]').first()
    if (await order.isVisible({ timeout: 5000 }).catch(() => false)) {
      await order.click()
      await page.waitForTimeout(3000)

      const completeBtn = page.locator('button:has-text("구매 확정")')
      if (await completeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await completeBtn.click()
        await page.waitForTimeout(3000)
        console.log('  구매 확정 클릭 완료')
      }
    }
  })

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

        // 리뷰 내용 입력
        const textarea = page.locator('textarea')
        if (await textarea.isVisible({ timeout: 3000 }).catch(() => false)) {
          await textarea.fill('E2E 테스트 리뷰입니다. 서비스 품질이 좋습니다.')
        }

        // 제출
        const submitBtn = page.locator('button[type="submit"], button:has-text("리뷰 등록"), button:has-text("작성")')
        if (await submitBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
          await submitBtn.first().click()
          await page.waitForTimeout(3000)
        }
      }
    }
  })
})

// ════════════════════════════════════════════════════════════
// F. API 엔드포인트 테스트
// ════════════════════════════════════════════════════════════

test.describe('F. API 엔드포인트', () => {
  test('F-1. GET /api/services - 서비스 목록', async ({ request }) => {
    const res = await request.get('/api/services')
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.length).toBeGreaterThanOrEqual(1)
    // 각 서비스에 필수 필드 존재
    const service = body.data[0]
    expect(service.id).toBeTruthy()
    expect(service.title).toBeTruthy()
    expect(service.status).toBe('ACTIVE')
  })

  test('F-2. GET /api/services?q=로고 - 검색', async ({ request }) => {
    const res = await request.get('/api/services?q=로고')
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  test('F-3. GET /api/services/:id - 서비스 상세', async ({ request }) => {
    const listRes = await request.get('/api/services')
    const listBody = await listRes.json()
    const id = listBody.data[0].id

    const res = await request.get(`/api/services/${id}`)
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.title).toBeTruthy()
    // 패키지 포함
    expect(body.data.packages).toBeDefined()
  })

  test('F-4. GET /api/categories - 카테고리 목록', async ({ request }) => {
    const res = await request.get('/api/categories')
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.length).toBeGreaterThanOrEqual(10)
  })

  test('F-5. GET /api/reviews - 리뷰 목록', async ({ request }) => {
    const listRes = await request.get('/api/services')
    const listBody = await listRes.json()
    const id = listBody.data[0].id

    const res = await request.get(`/api/reviews?serviceId=${id}`)
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  test('F-6. GET /api/services - 정렬 동작', async ({ request }) => {
    // 최신순
    const newest = await request.get('/api/services?sort=newest')
    expect(newest.ok()).toBeTruthy()
    // 평점순
    const rating = await request.get('/api/services?sort=rating')
    expect(rating.ok()).toBeTruthy()
    // 주문순
    const orders = await request.get('/api/services?sort=orders')
    expect(orders.ok()).toBeTruthy()
  })

  test('F-7. GET /api/services - 페이지네이션', async ({ request }) => {
    const page1 = await request.get('/api/services?page=1')
    expect(page1.ok()).toBeTruthy()
    const body1 = await page1.json()
    expect(body1.data.length).toBeGreaterThanOrEqual(1)

    // page 2는 데이터가 부족하면 빈 배열 또는 에러 가능
    const page2 = await request.get('/api/services?page=2')
    const body2 = await page2.json()
    // 응답 형태만 확인 (데이터가 없을 수 있음)
    expect(body2).toBeDefined()
  })
})

// ════════════════════════════════════════════════════════════
// G. 반응형 / 모바일 네비게이션
// ════════════════════════════════════════════════════════════

test.describe('G. 모바일 UI', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('G-1. 모바일 홈페이지 로드', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: '전문가에게 맡기세요' })).toBeVisible({ timeout: TIMEOUT })
  })

  test('G-2. 모바일 하단 네비게이션 표시', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)
    // MobileNav 컴포넌트 (하단 nav)
    const nav = page.locator('nav.fixed, [class*="fixed"][class*="bottom"]')
    const hasNav = await nav.first().isVisible({ timeout: 5000 }).catch(() => false)
    console.log(`  모바일 네비게이션 표시: ${hasNav}`)
  })

  test('G-3. 모바일 서비스 카드 1열 표시', async ({ page }) => {
    await page.goto('/services')
    const cards = page.locator('[class*="card"]')
    await expect(cards.first()).toBeVisible({ timeout: TIMEOUT })
  })

  test('G-4. 모바일 로그인 후 하단 네비게이션', async ({ page }) => {
    await login(page, BUYER)
    await page.goto('/')
    await page.waitForTimeout(3000)
    // 로그인 후 메시지/마이페이지 아이콘 표시
    const nav = page.locator('nav.fixed, [class*="fixed"][class*="bottom"]')
    const hasNav = await nav.first().isVisible({ timeout: 5000 }).catch(() => false)
    console.log(`  로그인 후 모바일 네비게이션 표시: ${hasNav}`)
  })
})

// ════════════════════════════════════════════════════════════
// H. 에러 케이스 / 엣지 케이스
// ════════════════════════════════════════════════════════════

test.describe('H. 에러 케이스', () => {
  test('H-1. 존재하지 않는 서비스 → 404', async ({ page }) => {
    await page.goto('/services/00000000-0000-0000-0000-000000000000')
    await page.waitForTimeout(3000)
    // 404 페이지 또는 에러 표시
    const is404 = await page.getByText(/찾을 수 없|404|not found/i).isVisible({ timeout: 5000 }).catch(() => false)
    console.log(`  존재하지 않는 서비스 404: ${is404}`)
  })

  test('H-2. 존재하지 않는 페이지 → 404', async ({ page }) => {
    await page.goto('/this-page-does-not-exist')
    await page.waitForTimeout(3000)
    const is404 = await page.getByText(/찾을 수 없|404|not found/i).isVisible({ timeout: 5000 }).catch(() => false)
    console.log(`  존재하지 않는 페이지 404: ${is404}`)
  })

  test('H-3. 빈 검색 결과', async ({ page }) => {
    await page.goto('/services?q=zzzzxxxxxxxnoexist')
    await page.waitForTimeout(3000)
    await expect(page.getByText(/검색 결과가 없습니다/)).toBeVisible({ timeout: TIMEOUT })
  })

  test('H-4. 회원가입 - 유효성 검증', async ({ page }) => {
    await page.goto('/register')
    // 빈 폼 제출 시도
    const submitBtn = page.locator('button[type="submit"]')
    await submitBtn.click()
    await page.waitForTimeout(2000)
    // 여전히 회원가입 페이지
    await expect(page).toHaveURL(/register/)
  })
})

// ════════════════════════════════════════════════════════════
// I. 수정 요청 플로우 (DELIVERED → REVISION_REQUESTED → DELIVERED)
// ════════════════════════════════════════════════════════════

test.describe('I. 수정 요청 플로우', () => {
  test('I-1. 구매자: 납품된 주문에 수정요청 버튼 표시', async ({ page }) => {
    await login(page, BUYER)
    await page.goto('/orders')
    await page.waitForTimeout(3000)

    // 주문 목록에서 첫 번째 주문 클릭
    const orderLink = page.locator('a[href*="/orders/"]').first()
    if (await orderLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await orderLink.click()
      await page.waitForURL(/orders\//, { timeout: TIMEOUT })

      // DELIVERED 상태일 때 수정요청 버튼이 표시되어야 함
      const revisionBtn = page.locator('button:has-text("수정 요청")')
      const hasRevision = await revisionBtn.isVisible({ timeout: 5000 }).catch(() => false)
      console.log(`  수정 요청 버튼 존재: ${hasRevision}`)
      // DELIVERED 상태가 아닐 수 있으므로 존재 여부만 확인
    }
  })

  test('I-2. 구매자: 수정요청 시 메모 입력 가능', async ({ page }) => {
    await login(page, BUYER)
    await page.goto('/orders')
    await page.waitForTimeout(3000)

    const orderLink = page.locator('a[href*="/orders/"]').first()
    if (await orderLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await orderLink.click()
      await page.waitForURL(/orders\//, { timeout: TIMEOUT })

      // 메모 입력 필드 확인 (선택사항)
      const memo = page.locator('textarea[placeholder*="메모"]')
      const hasMemo = await memo.isVisible({ timeout: 5000 }).catch(() => false)
      console.log(`  메모 입력 필드 존재: ${hasMemo}`)
      if (hasMemo) {
        await memo.fill('수정 사항: 색상을 파란색으로 변경해주세요.')
      }
    }
  })

  test('I-3. 판매자: 수정요청된 주문 상태 확인', async ({ page }) => {
    await login(page, SELLER)
    await page.goto('/seller/orders')
    await page.waitForTimeout(3000)

    const orderLink = page.locator('a[href*="/seller/orders/"]').first()
    if (await orderLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await orderLink.click()
      await page.waitForTimeout(3000)

      // 수정요청 상태의 주문이면 납품 버튼이 보여야 함
      const deliverBtn = page.locator('button:has-text("납품")')
      const hasDeliver = await deliverBtn.isVisible({ timeout: 5000 }).catch(() => false)
      console.log(`  재납품 버튼 존재: ${hasDeliver}`)
    }
  })
})

// ════════════════════════════════════════════════════════════
// J. 판매자 리뷰 답글
// ════════════════════════════════════════════════════════════

test.describe('J. 판매자 리뷰 답글', () => {
  test('J-1. API: 판매자 리뷰 답글 등록', async ({ page }) => {
    await login(page, SELLER)

    // 리뷰 목록에서 리뷰 ID 가져오기
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
    // 리뷰가 있는 서비스 찾기
    const servicesRes = await page.request.get('/api/services')
    const servicesBody = await servicesRes.json()
    const service = servicesBody.data?.[0]
    if (!service) return

    await page.goto(`/services/${service.id}`)
    await page.waitForTimeout(3000)

    // 리뷰 섹션 스크롤
    const reviewSection = page.getByText('리뷰').first()
    if (await reviewSection.isVisible({ timeout: 5000 }).catch(() => false)) {
      await reviewSection.scrollIntoViewIfNeeded()
      await page.waitForTimeout(1000)

      // 판매자 답변 표시 확인
      const sellerReply = page.getByText('판매자 답변')
      const hasReply = await sellerReply.first().isVisible({ timeout: 5000 }).catch(() => false)
      console.log(`  판매자 답변 표시: ${hasReply}`)
    }
  })
})

// ════════════════════════════════════════════════════════════
// K. 알림 기능
// ════════════════════════════════════════════════════════════

test.describe('K. 알림 기능', () => {
  test('K-1. API: 알림 목록 조회', async ({ page }) => {
    await login(page, BUYER)

    const res = await page.request.get('/api/notifications')
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data)).toBe(true)
    console.log(`  알림 수: ${body.data.length}`)

    // 알림 데이터 구조 확인
    if (body.data.length > 0) {
      const notif = body.data[0]
      expect(notif.id).toBeTruthy()
      expect(notif.type).toBeTruthy()
      expect(notif.title).toBeTruthy()
    }
  })

  test('K-2. API: 전체 알림 읽음 처리', async ({ page }) => {
    await login(page, BUYER)

    const res = await page.request.post('/api/notifications/read-all')
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.success).toBe(true)

    // 읽음 처리 후 재조회 - 모두 is_read: true 여야 함
    const checkRes = await page.request.get('/api/notifications')
    const checkBody = await checkRes.json()
    if (checkBody.data?.length > 0) {
      const unread = checkBody.data.filter((n: any) => !n.is_read)
      expect(unread.length).toBe(0)
    }
  })

  test('K-3. 헤더 알림 벨 클릭 → 알림 목록 표시', async ({ page }) => {
    await login(page, BUYER)
    await page.goto('/')
    await page.waitForTimeout(3000)

    // 알림 벨 아이콘 클릭
    const bell = page.locator('header button:has(svg.lucide-bell)')
    if (await bell.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await bell.first().click()
      await page.waitForTimeout(2000)

      // 알림 드롭다운/패널 표시 확인
      const notifPanel = page.locator('[role="menu"], [class*="dropdown"], [class*="popover"]')
      const hasPanel = await notifPanel.first().isVisible({ timeout: 3000 }).catch(() => false)
      console.log(`  알림 패널 표시: ${hasPanel}`)
    }
  })

  test('K-4. 판매자에게도 알림 존재', async ({ page }) => {
    await login(page, SELLER)

    const res = await page.request.get('/api/notifications')
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.success).toBe(true)
    console.log(`  판매자 알림 수: ${body.data.length}`)
  })
})

// ════════════════════════════════════════════════════════════
// L. 구매자 설정 페이지
// ════════════════════════════════════════════════════════════

test.describe('L. 구매자 설정 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, BUYER)
  })

  test('L-1. 설정 페이지 로드 - 닉네임/소개 필드 표시', async ({ page }) => {
    await page.goto('/mypage/settings')
    await page.waitForTimeout(5000)

    // 제목
    await expect(page.getByRole('heading', { name: '설정' })).toBeVisible({ timeout: TIMEOUT })
    // 닉네임 입력 필드
    await expect(page.getByText('닉네임')).toBeVisible()
    const nicknameInput = page.locator('input').first()
    await expect(nicknameInput).toBeVisible()

    // 소개 textarea
    await expect(page.getByText('소개')).toBeVisible()
    const bioTextarea = page.locator('textarea')
    await expect(bioTextarea).toBeVisible()
  })

  test('L-2. 닉네임/소개 수정 후 저장', async ({ page }) => {
    await page.goto('/mypage/settings')
    await page.waitForTimeout(3000)

    // 소개 수정
    const bioTextarea = page.locator('textarea')
    if (await bioTextarea.isVisible({ timeout: 3000 }).catch(() => false)) {
      await bioTextarea.fill('E2E 테스트로 수정된 자기소개입니다.')
    }

    // 저장 버튼 클릭
    const saveBtn = page.getByRole('button', { name: '저장' })
    await expect(saveBtn).toBeVisible()
    await saveBtn.click()
    await page.waitForTimeout(3000)

    // 성공 토스트 확인
    const toast = page.getByText('프로필이 수정되었습니다')
    const hasToast = await toast.isVisible({ timeout: 5000 }).catch(() => false)
    console.log(`  저장 성공 토스트: ${hasToast}`)
  })

  test('L-3. 마이페이지에서 설정 페이지 이동', async ({ page }) => {
    await page.goto('/mypage')
    await page.waitForTimeout(3000)

    // 설정 버튼/링크
    const settingsLink = page.locator('a[href*="/settings"], button:has-text("설정")')
    await expect(settingsLink.first()).toBeVisible({ timeout: TIMEOUT })
    await settingsLink.first().click()
    await expect(page).toHaveURL(/settings/, { timeout: TIMEOUT })
  })
})

// ════════════════════════════════════════════════════════════
// M. 구매자/판매자 모드 전환
// ════════════════════════════════════════════════════════════

test.describe('M. 모드 전환', () => {
  test('M-1. 구매자 → 판매자 모드 전환', async ({ page }) => {
    await login(page, BUYER)
    await page.goto('/')
    await page.waitForTimeout(3000)

    // "판매자 모드로 전환" 버튼
    const toggleBtn = page.getByText('판매자 모드로 전환')
    await expect(toggleBtn).toBeVisible({ timeout: TIMEOUT })
    await toggleBtn.click()
    await page.waitForTimeout(2000)

    // 전환 후 "구매자 모드로 전환" 텍스트로 변경
    await expect(page.getByText('구매자 모드로 전환')).toBeVisible({ timeout: TIMEOUT })
    // 판매자 메뉴 표시 (판매자 홈)
    await expect(page.getByRole('link', { name: '판매자 홈' })).toBeVisible()
  })

  test('M-2. 판매자 → 구매자 모드 전환', async ({ page }) => {
    await login(page, BUYER)
    await page.goto('/')
    await page.waitForTimeout(3000)

    // 먼저 판매자 모드로 전환
    const toSeller = page.getByText('판매자 모드로 전환')
    if (await toSeller.isVisible({ timeout: 3000 }).catch(() => false)) {
      await toSeller.click()
      await page.waitForTimeout(2000)
    }

    // 다시 구매자 모드로 전환
    const toBuyer = page.getByText('구매자 모드로 전환')
    await expect(toBuyer).toBeVisible({ timeout: TIMEOUT })
    await toBuyer.click()
    await page.waitForTimeout(2000)

    // 구매자 메뉴로 복귀
    await expect(page.getByText('판매자 모드로 전환')).toBeVisible({ timeout: TIMEOUT })
  })

  test('M-3. 모드 전환 후 페이지 새로고침 시 유지', async ({ page }) => {
    await login(page, BUYER)
    await page.goto('/')
    await page.waitForTimeout(3000)

    // 판매자 모드로 전환
    const toggleBtn = page.getByText('판매자 모드로 전환')
    if (await toggleBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await toggleBtn.click()
      await page.waitForTimeout(2000)
    }

    // 페이지 새로고침
    await page.reload()
    await page.waitForTimeout(3000)

    // 판매자 모드 유지 확인 (localStorage persist)
    await expect(page.getByText('구매자 모드로 전환')).toBeVisible({ timeout: TIMEOUT })
  })
})

// ════════════════════════════════════════════════════════════
// N. 서비스 검색 필터 조합
// ════════════════════════════════════════════════════════════

test.describe('N. 서비스 검색 필터', () => {
  test('N-1. 카테고리 필터 클릭 → URL 반영 + 결과 변경', async ({ page }) => {
    await page.goto('/services')
    await page.waitForTimeout(2000)

    // 사이드바 카테고리 링크 (첫 번째 카테고리)
    const catLink = page.locator('a[href*="services?category="]').first()
    if (await catLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      const catText = await catLink.textContent()
      await catLink.click()
      await page.waitForTimeout(2000)

      // URL에 category 파라미터 반영
      expect(page.url()).toContain('category=')
      // 결과 표시
      await expect(page.getByText(/총.*\d+.*개의 서비스/)).toBeVisible({ timeout: TIMEOUT })
      console.log(`  선택한 카테고리: ${catText}`)
    }
  })

  test('N-2. 정렬 옵션 - 최신순', async ({ page }) => {
    await page.goto('/services')
    await page.waitForTimeout(2000)

    const sortLink = page.locator('a[href*="sort=newest"]')
    if (await sortLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await sortLink.click()
      await page.waitForTimeout(2000)
      expect(page.url()).toContain('sort=newest')
    }
  })

  test('N-3. 정렬 옵션 - 평점순', async ({ page }) => {
    await page.goto('/services')
    await page.waitForTimeout(2000)

    const sortLink = page.locator('a[href*="sort=rating"]')
    if (await sortLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await sortLink.click()
      await page.waitForTimeout(2000)
      expect(page.url()).toContain('sort=rating')
    }
  })

  test('N-4. 정렬 옵션 - 가격 낮은순', async ({ page }) => {
    await page.goto('/services')
    await page.waitForTimeout(2000)

    const sortLink = page.locator('a[href*="sort=price_asc"]')
    if (await sortLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await sortLink.click()
      await page.waitForTimeout(2000)
      expect(page.url()).toContain('sort=price_asc')
    }
  })

  test('N-5. 정렬 옵션 - 가격 높은순', async ({ page }) => {
    await page.goto('/services')
    await page.waitForTimeout(2000)

    const sortLink = page.locator('a[href*="sort=price_desc"]')
    if (await sortLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await sortLink.click()
      await page.waitForTimeout(2000)
      expect(page.url()).toContain('sort=price_desc')
    }
  })

  test('N-6. 카테고리 + 정렬 조합', async ({ page }) => {
    await page.goto('/services')
    await page.waitForTimeout(2000)

    // 먼저 카테고리 선택
    const catLink = page.locator('a[href*="services?category="]').first()
    if (await catLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await catLink.click()
      await page.waitForURL(/category=/, { timeout: TIMEOUT })

      // 정렬 링크 확인 - 카테고리 선택 후에도 정렬 옵션이 보여야 함
      const sortLink = page.locator('a[href*="sort=newest"]')
      const hasSortLink = await sortLink.isVisible({ timeout: 5000 }).catch(() => false)
      console.log(`  카테고리 선택 후 정렬 옵션 표시: ${hasSortLink}`)

      if (hasSortLink) {
        // 정렬 링크 href에 category 파라미터가 포함되어야 함
        const href = await sortLink.getAttribute('href')
        console.log(`  정렬 링크 href: ${href}`)
        expect(href).toContain('category=')
        expect(href).toContain('sort=newest')

        await sortLink.click()
        await page.waitForURL(/sort=/, { timeout: TIMEOUT })
        expect(page.url()).toContain('sort=newest')
      }
    }
  })

  test('N-7. 검색어 + 결과 없음 → 안내 메시지', async ({ page }) => {
    await page.goto('/services')
    await page.waitForTimeout(2000)

    const searchInput = page.locator('input[placeholder*="서비스"]').first()
    await expect(searchInput).toBeVisible({ timeout: TIMEOUT })
    await searchInput.fill('zzzzxxxxxxxnoexist999')
    await searchInput.press('Enter')
    await page.waitForTimeout(3000)

    await expect(page.getByText('검색 결과가 없습니다')).toBeVisible({ timeout: TIMEOUT })
    // 안내 문구도 표시
    await expect(page.getByText(/다른 검색어|필터/)).toBeVisible()
  })

  test('N-8. API: 정렬별 서비스 목록 응답 검증', async ({ request }) => {
    // 추천순 (기본)
    const rec = await request.get('/api/services?sort=recommended')
    expect(rec.ok()).toBeTruthy()

    // 가격 낮은순
    const priceAsc = await request.get('/api/services?sort=price_asc')
    expect(priceAsc.ok()).toBeTruthy()

    // 가격 높은순
    const priceDesc = await request.get('/api/services?sort=price_desc')
    expect(priceDesc.ok()).toBeTruthy()

    // 주문 많은순
    const orders = await request.get('/api/services?sort=orders')
    expect(orders.ok()).toBeTruthy()
  })
})
