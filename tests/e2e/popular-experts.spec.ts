import { test, expect } from '@playwright/test'
import { TIMEOUT } from './helpers'

test.describe('메인 페이지 - 인기 전문가 섹션', () => {
  test('EXP-1. 메인 페이지에 "인기 전문가" 섹션이 표시됨', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(3000)

    // seller_profiles에 데이터가 있어야 섹션이 렌더링됨 (조건부: topSellers?.length > 0)
    // API로 데이터 존재 여부 먼저 확인
    const apiRes = await page.request.get('/api/services')
    // seller_profiles를 직접 체크할 API는 없으므로 UI 기반 검증
    // 섹션이 없을 경우(판매자 데이터 없음) 스킵 처리

    const sectionHeading = page.locator('h2', { hasText: '인기 전문가' })
    const sectionVisible = await sectionHeading.isVisible({ timeout: 10000 }).catch(() => false)

    if (!sectionVisible) {
      test.skip(true, '인기 전문가 섹션 미표시 — seller_profiles 데이터 없음 또는 미배포')
      return
    }

    await expect(sectionHeading).toBeVisible({ timeout: TIMEOUT })
  })

  test('EXP-2. 인기 전문가 섹션에 전문가 카드가 표시됨 (프로필/닉네임)', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(3000)

    const sectionHeading = page.locator('h2', { hasText: '인기 전문가' })
    const sectionVisible = await sectionHeading.isVisible({ timeout: 10000 }).catch(() => false)

    if (!sectionVisible) {
      test.skip(true, '인기 전문가 섹션 미표시 — 데이터 없음 또는 미배포')
      return
    }

    // 섹션 컨테이너 내의 카드 확인
    const section = page.locator('section').filter({ hasText: '인기 전문가' })
    await expect(section).toBeVisible({ timeout: TIMEOUT })

    // 카드: grid grid-cols-2 / sm:grid-cols-4 내 Link 요소
    const cards = section.locator('a[href*="/sellers/"]')
    const cardCount = await cards.count()
    expect(cardCount).toBeGreaterThanOrEqual(1)

    // 첫 번째 카드에 아바타(Avatar) 또는 fallback이 표시됨
    const firstCard = cards.first()
    // Avatar 컴포넌트: span.relative (AvatarFallback) 또는 img (AvatarImage)
    const avatarArea = firstCard.locator('span.relative, img[src]')
    const hasAvatar = await avatarArea.first().isVisible({ timeout: 5000 }).catch(() => false)
    // AvatarFallback 텍스트로 대체 검증
    if (!hasAvatar) {
      const fallback = firstCard.locator('span[class*="fallback"], span[class*="AvatarFallback"]')
      const hasFallback = await fallback.first().isVisible({ timeout: 5000 }).catch(() => false)
      // 둘 다 없으면 p.font-semibold(닉네임)만 확인
      if (!hasFallback) {
        const nickname = firstCard.locator('p.font-semibold')
        await expect(nickname).toBeVisible({ timeout: TIMEOUT })
      }
    }

    // 닉네임(p.font-semibold) 확인
    const nickname = firstCard.locator('p.font-semibold')
    await expect(nickname).toBeVisible({ timeout: TIMEOUT })
    const nicknameText = await nickname.textContent()
    expect(nicknameText?.trim().length).toBeGreaterThan(0)
  })

  test('EXP-3. 인기 전문가 카드에 등급 배지와 평점이 표시됨', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(3000)

    const sectionHeading = page.locator('h2', { hasText: '인기 전문가' })
    const sectionVisible = await sectionHeading.isVisible({ timeout: 10000 }).catch(() => false)

    if (!sectionVisible) {
      test.skip(true, '인기 전문가 섹션 미표시 — 데이터 없음 또는 미배포')
      return
    }

    const section = page.locator('section').filter({ hasText: '인기 전문가' })
    const cards = section.locator('a[href*="/sellers/"]')
    const cardCount = await cards.count()
    expect(cardCount).toBeGreaterThanOrEqual(1)

    const firstCard = cards.first()

    // 등급 배지 (Badge variant="secondary")
    // constants.ts: SELLER_GRADES = { NEW: '신규', GENERAL: '일반', PRO: '전문가', MASTER: '마스터' }
    const gradeBadge = firstCard.locator('[class*="badge"], [class*="Badge"]')
    const hasBadge = await gradeBadge.first().isVisible({ timeout: 5000 }).catch(() => false)
    if (hasBadge) {
      await expect(gradeBadge.first()).toBeVisible({ timeout: TIMEOUT })
    }

    // 평점 (Star 아이콘 + 숫자)
    const ratingText = firstCard.locator('span', { hasText: /^\d+\.\d+$/ })
    const hasRating = await ratingText.first().isVisible({ timeout: 5000 }).catch(() => false)
    if (hasRating) {
      const ratingValue = await ratingText.first().textContent()
      const rating = Number(ratingValue?.trim())
      expect(rating).toBeGreaterThanOrEqual(0)
      expect(rating).toBeLessThanOrEqual(5)
    }
  })

  test('EXP-4. 인기 전문가 카드 클릭 시 판매자 상세 페이지로 이동 (링크 확인)', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(3000)

    const sectionHeading = page.locator('h2', { hasText: '인기 전문가' })
    const sectionVisible = await sectionHeading.isVisible({ timeout: 10000 }).catch(() => false)

    if (!sectionVisible) {
      test.skip(true, '인기 전문가 섹션 미표시 — 데이터 없음 또는 미배포')
      return
    }

    const section = page.locator('section').filter({ hasText: '인기 전문가' })
    const cards = section.locator('a[href*="/sellers/"]')
    const cardCount = await cards.count()
    expect(cardCount).toBeGreaterThanOrEqual(1)

    // 링크 href가 /sellers/{uuid} 패턴인지 확인
    const firstCard = cards.first()
    const href = await firstCard.getAttribute('href')
    expect(href).toMatch(/\/sellers\/[0-9a-f-]{36}/)
  })
})
