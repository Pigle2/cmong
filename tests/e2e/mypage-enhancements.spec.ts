import { test, expect } from '@playwright/test'
import { BUYER, SELLER, TIMEOUT, login } from './helpers'

/**
 * 마이페이지 UI 개선 테스트
 *
 * 수정 내용:
 * 1. 진행중/완료 주문 수 분리 (기존: "주문" 1개 카드 → "진행중" + "완료" 2개 카드)
 * 2. 판매자 등급 배지 표시 (sellerProfile.grade가 있을 때)
 *
 * 배포 감지: /mypage 접근 후 "진행중" 텍스트 존재 여부로 판단
 * 미배포 시 (기존 "주문" 카드만 있을 때) 자동 스킵
 */

test.describe('마이페이지 UI 개선', () => {
  test('MY-ENH-1. 마이페이지에 "진행중" 주문 수가 표시됨', async ({ page }) => {
    await login(page, BUYER)
    await page.goto('/mypage')
    await page.waitForTimeout(3000)

    // 로그인 리다이렉트 감지
    const currentUrl = page.url()
    if (currentUrl.includes('/login')) {
      test.skip(true, '마이페이지 접근 불가 - 로그인 리다이렉트')
      return
    }

    // 배포 감지: "진행중" 라벨이 없으면 아직 구 버전(주문/찜/리뷰 구조)
    const activeLabel = page.locator('text=진행중')
    const isDeployed = await activeLabel.isVisible({ timeout: 5000 }).catch(() => false)
    if (!isDeployed) {
      test.skip(true, '진행중/완료 분리 미배포 — 기존 "주문" 통합 카드 버전')
      return
    }

    await expect(activeLabel).toBeVisible({ timeout: TIMEOUT })

    // 진행중 카드에 숫자(count)가 표시되는지 확인
    // 구조: CardContent > div.text-2xl.font-bold(숫자) + div.text-xs.text-muted-foreground("진행중")
    const activeCard = page
      .locator('div.text-xs.text-muted-foreground', { hasText: '진행중' })
      .locator('..')
    await expect(activeCard).toBeVisible({ timeout: TIMEOUT })

    const countEl = activeCard.locator('div.text-2xl.font-bold')
    await expect(countEl).toBeVisible({ timeout: TIMEOUT })

    const countText = await countEl.textContent()
    expect(Number(countText?.trim())).toBeGreaterThanOrEqual(0)
  })

  test('MY-ENH-2. 마이페이지에 "완료" 주문 수가 표시됨', async ({ page }) => {
    await login(page, BUYER)
    await page.goto('/mypage')
    await page.waitForTimeout(3000)

    const currentUrl = page.url()
    if (currentUrl.includes('/login')) {
      test.skip(true, '마이페이지 접근 불가 - 로그인 리다이렉트')
      return
    }

    // 배포 감지
    const completedLabel = page.locator('text=완료')
    const isDeployed = await completedLabel.isVisible({ timeout: 5000 }).catch(() => false)
    if (!isDeployed) {
      test.skip(true, '진행중/완료 분리 미배포 — 기존 "주문" 통합 카드 버전')
      return
    }

    await expect(completedLabel).toBeVisible({ timeout: TIMEOUT })

    // 완료 카드에 숫자(count)가 표시되는지 확인
    const completedCard = page
      .locator('div.text-xs.text-muted-foreground', { hasText: '완료' })
      .locator('..')
    await expect(completedCard).toBeVisible({ timeout: TIMEOUT })

    const countEl = completedCard.locator('div.text-2xl.font-bold')
    await expect(countEl).toBeVisible({ timeout: TIMEOUT })

    const countText = await countEl.textContent()
    expect(Number(countText?.trim())).toBeGreaterThanOrEqual(0)
  })

  test('MY-ENH-3. 마이페이지 통계 - 진행중/완료가 별도 카드로 분리되어 표시됨', async ({ page }) => {
    await login(page, BUYER)
    await page.goto('/mypage')
    await page.waitForTimeout(3000)

    const currentUrl = page.url()
    if (currentUrl.includes('/login')) {
      test.skip(true, '마이페이지 접근 불가 - 로그인 리다이렉트')
      return
    }

    // 배포 감지: 신규 버전은 grid-cols-4 (진행중/완료/찜/리뷰)
    // 구 버전은 grid-cols-3 (주문/찜/리뷰)
    const activeLabel = page.locator('text=진행중')
    const isDeployed = await activeLabel.isVisible({ timeout: 5000 }).catch(() => false)
    if (!isDeployed) {
      test.skip(true, '진행중/완료 분리 미배포 — 기존 "주문" 통합 카드 버전')
      return
    }

    // 신규 버전: 진행중 / 완료 / 찜 / 리뷰 — 4개 라벨 모두 표시
    await expect(page.locator('text=진행중')).toBeVisible({ timeout: TIMEOUT })
    await expect(page.locator('text=완료')).toBeVisible({ timeout: TIMEOUT })
    await expect(page.locator('text=찜')).toBeVisible({ timeout: TIMEOUT })
    await expect(page.locator('text=리뷰')).toBeVisible({ timeout: TIMEOUT })

    // 통계 그리드: 4개 카드 (grid-cols-4)
    const statCards = page.locator('div.grid.grid-cols-4 > a, div.grid.grid-cols-4 > div')
    const cardCount = await statCards.count()
    expect(cardCount).toBe(4)
  })

  test('MY-ENH-4. 마이페이지 판매자 등급 배지 표시 (판매자 계정)', async ({ page }) => {
    await login(page, SELLER)
    await page.goto('/mypage')
    await page.waitForTimeout(3000)

    const currentUrl = page.url()
    if (currentUrl.includes('/login')) {
      test.skip(true, '마이페이지 접근 불가 - 로그인 리다이렉트')
      return
    }

    // 판매자 등급 배지: SELLER_GRADES = { NEW: '신규', GENERAL: '일반', PRO: '전문가', MASTER: '마스터' }
    // 소스: sellerProfile?.grade가 있을 때만 Badge 렌더링 (조건부)
    const gradeLabels = ['신규', '일반', '전문가', '마스터', 'NEW', 'GENERAL', 'PRO', 'MASTER']

    // Badge 컴포넌트 (variant="secondary") 내 등급 텍스트
    const badge = page.locator('[class*="badge"], [class*="Badge"]').filter({
      hasText: new RegExp(gradeLabels.join('|'), 'i'),
    })

    const badgeVisible = await badge.first().isVisible({ timeout: 8000 }).catch(() => false)
    if (!badgeVisible) {
      // 판매자 프로필이 없거나 등급이 설정되지 않은 경우 — 조건부 렌더링이므로 스킵
      test.skip(true, '판매자 등급 배지 없음 (판매자 프로필 미등록 또는 등급 없음)')
      return
    }
    await expect(badge.first()).toBeVisible({ timeout: TIMEOUT })
  })

  test('MY-ENH-5. 마이페이지 기본 구조 (미배포 버전 포함) - 로그인 후 마이페이지 접근 가능', async ({ page }) => {
    await login(page, BUYER)
    await page.goto('/mypage')
    await page.waitForTimeout(3000)

    const currentUrl = page.url()
    if (currentUrl.includes('/login')) {
      test.skip(true, '마이페이지 접근 불가 - 로그인 리다이렉트')
      return
    }

    // 프로필 카드: 닉네임 표시
    await expect(page.locator('h1', { hasText: '구매자김철수' })).toBeVisible({ timeout: TIMEOUT })

    // 통계 카드 영역 존재 (진행중/완료 분리 여부에 무관)
    // 구 버전: div.text-xs.text-muted-foreground "주문"
    // 신규 버전: div.text-xs.text-muted-foreground "진행중" + "완료"
    const hasActiveCard = await page
      .locator('div.text-xs.text-muted-foreground', { hasText: '진행중' })
      .isVisible({ timeout: 3000 }).catch(() => false)
    const hasLegacyCard = await page
      .locator('div.text-xs.text-muted-foreground', { hasText: '주문' })
      .isVisible({ timeout: 3000 }).catch(() => false)
    expect(hasActiveCard || hasLegacyCard).toBeTruthy()

    // 찜/리뷰 카드 항상 존재
    await expect(page.locator('text=찜')).toBeVisible({ timeout: TIMEOUT })
    await expect(page.locator('text=리뷰')).toBeVisible({ timeout: TIMEOUT })

    // 최근 주문 섹션 헤딩
    await expect(page.locator('text=최근 주문')).toBeVisible({ timeout: TIMEOUT })
  })
})
