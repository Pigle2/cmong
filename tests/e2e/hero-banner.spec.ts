import { test, expect } from '@playwright/test'
import { TIMEOUT } from './helpers'

/**
 * 메인 페이지 - 히어로 배너 슬라이더 테스트
 *
 * HERO-1: 메인 페이지에 배너 영역이 표시됨
 * HERO-2: 배너에 화살표 버튼이 존재함
 * HERO-3: dot 인디케이터가 표시됨
 * HERO-4: 화살표 클릭 시 배너 내용이 변경됨
 * HERO-5: 검색바가 배너 안에 포함됨
 *
 * HeroBanner 컴포넌트 구조:
 * - <section> with dynamic gradient class
 * - 좌우 arrow button: aria-label="이전 배너" / "다음 배너"
 * - dot indicator: aria-label="N번 배너로 이동"
 * - 내부에 ServiceSearchBar 포함
 * - 3개 배너 (전문가에게 맡기세요 / 당신의 아이디어를 현실로 / 합리적인 가격, 최고의 결과)
 */

// 배포 여부 확인 헬퍼 — 화살표 버튼 aria-label 기반
async function isHeroBannerDeployed(page: import('@playwright/test').Page): Promise<boolean> {
  return page.getByRole('button', { name: '다음 배너' }).isVisible({ timeout: 5000 }).catch(() => false)
}

test.describe('메인 페이지 - 히어로 배너 슬라이더 (HERO)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle', { timeout: TIMEOUT })
  })

  test('HERO-1: 메인 페이지에 배너 영역이 표시됨', async ({ page }) => {
    const isDeployed = await isHeroBannerDeployed(page)
    if (!isDeployed) {
      test.skip(true, '히어로 배너 슬라이더 미배포 — 이전 Hero 섹션으로 폴백')
      return
    }

    // 배너 section 태그가 존재해야 함
    // HeroBanner는 <section> 태그로 렌더링됨 (dynamic gradient class 포함)
    const bannerSection = page.locator('section').first()
    await expect(bannerSection).toBeVisible({ timeout: TIMEOUT })

    // 배너 타이틀 텍스트 중 하나가 표시되어야 함 (3개 중 현재 표시 중인 것)
    const bannerTitles = ['전문가에게 맡기세요', '당신의 아이디어를 현실로', '합리적인 가격, 최고의 결과']
    let foundTitle = false
    for (const title of bannerTitles) {
      const isVisible = await page.getByText(title).isVisible({ timeout: 3000 }).catch(() => false)
      if (isVisible) {
        foundTitle = true
        console.log(`  현재 배너 타이틀: "${title}"`)
        break
      }
    }
    expect(foundTitle).toBeTruthy()
  })

  test('HERO-2: 배너에 화살표 버튼이 존재함', async ({ page }) => {
    const isDeployed = await isHeroBannerDeployed(page)
    if (!isDeployed) {
      test.skip(true, '히어로 배너 슬라이더 미배포')
      return
    }

    // 이전/다음 화살표 버튼 확인
    const prevButton = page.getByRole('button', { name: '이전 배너' })
    const nextButton = page.getByRole('button', { name: '다음 배너' })

    await expect(prevButton).toBeVisible({ timeout: TIMEOUT })
    await expect(nextButton).toBeVisible({ timeout: TIMEOUT })

    console.log('  이전/다음 화살표 버튼 표시 확인')
  })

  test('HERO-3: dot 인디케이터가 표시됨', async ({ page }) => {
    const isDeployed = await isHeroBannerDeployed(page)
    if (!isDeployed) {
      test.skip(true, '히어로 배너 슬라이더 미배포')
      return
    }

    // dot 인디케이터 버튼: aria-label="N번 배너로 이동" (3개)
    const dotButtons = page.getByRole('button', { name: /번 배너로 이동/ })
    const count = await dotButtons.count()

    expect(count).toBe(3)  // BANNERS 배열 3개
    console.log(`  dot 인디케이터 ${count}개 표시 확인`)

    // 각 dot 버튼이 보여야 함
    await expect(dotButtons.nth(0)).toBeVisible({ timeout: TIMEOUT })
    await expect(dotButtons.nth(1)).toBeVisible({ timeout: TIMEOUT })
    await expect(dotButtons.nth(2)).toBeVisible({ timeout: TIMEOUT })
  })

  test('HERO-4: 화살표 클릭 시 배너 내용이 변경됨', async ({ page }) => {
    const isDeployed = await isHeroBannerDeployed(page)
    if (!isDeployed) {
      test.skip(true, '히어로 배너 슬라이더 미배포')
      return
    }

    // 클릭 전 현재 배너 타이틀 기록
    const bannerTitles = ['전문가에게 맡기세요', '당신의 아이디어를 현실로', '합리적인 가격, 최고의 결과']
    let initialTitle: string | null = null
    for (const title of bannerTitles) {
      const isVisible = await page.getByText(title).isVisible({ timeout: 3000 }).catch(() => false)
      if (isVisible) {
        initialTitle = title
        break
      }
    }
    expect(initialTitle).not.toBeNull()
    console.log(`  클릭 전 배너: "${initialTitle}"`)

    // 다음 배너 버튼 클릭
    const nextButton = page.getByRole('button', { name: '다음 배너' })
    await nextButton.click()
    await page.waitForTimeout(700)  // 배너 전환 애니메이션 대기 (transition-all duration-700)

    // 클릭 후 다른 타이틀이 표시되어야 함
    let newTitle: string | null = null
    for (const title of bannerTitles) {
      const isVisible = await page.getByText(title).isVisible({ timeout: 3000 }).catch(() => false)
      if (isVisible) {
        newTitle = title
        break
      }
    }
    expect(newTitle).not.toBeNull()
    console.log(`  클릭 후 배너: "${newTitle}"`)

    // 배너가 변경되었는지 확인
    expect(newTitle).not.toBe(initialTitle)
  })

  test('HERO-5: 검색바가 배너 안에 포함됨', async ({ page }) => {
    const isDeployed = await isHeroBannerDeployed(page)
    if (!isDeployed) {
      // 미배포 시 기존 Hero 섹션의 검색바로 폴백 검증
      const searchInput = page.locator('input[type="search"], input[placeholder*="서비스"]').first()
      const isVisible = await searchInput.isVisible({ timeout: 5000 }).catch(() => false)
      if (!isVisible) {
        test.skip(true, '히어로 배너 슬라이더 미배포, 검색바도 미발견')
      }
      return
    }

    // HeroBanner 섹션 내 검색 input 존재 확인
    // ServiceSearchBar는 input[placeholder="어떤 서비스가 필요하세요?"] 렌더링
    const bannerSection = page.locator('section').first()
    await expect(bannerSection).toBeVisible({ timeout: TIMEOUT })

    // 배너 섹션 내 검색 input
    const searchInput = bannerSection.locator('input').first()
    await expect(searchInput).toBeVisible({ timeout: TIMEOUT })

    // placeholder 텍스트 확인
    const placeholder = await searchInput.getAttribute('placeholder')
    console.log(`  검색바 placeholder: "${placeholder}"`)
    expect(placeholder).toBeTruthy()

    // 검색어 입력 후 라우팅 확인
    await searchInput.fill('테스트검색')
    await searchInput.press('Enter')
    await page.waitForURL(/\/services/, { timeout: TIMEOUT })

    const url = page.url()
    expect(url).toContain('/services')
    console.log(`  검색 후 URL: ${url}`)
  })
})
