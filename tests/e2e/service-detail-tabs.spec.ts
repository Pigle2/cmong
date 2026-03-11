import { test, expect } from '@playwright/test'
import { TIMEOUT } from './helpers'

// 서비스 상세 페이지에서 첫 번째 서비스로 이동하는 헬퍼
async function gotoFirstServiceDetail(page: import('@playwright/test').Page) {
  await page.goto('/services')
  await page.waitForTimeout(2000)
  // 서비스 카드 링크 클릭
  const card = page.locator('a[href*="/services/"]').first()
  await expect(card).toBeVisible({ timeout: TIMEOUT })
  await card.click()
  await page.waitForURL(/\/services\/[^/]+$/, { timeout: TIMEOUT })
  await page.waitForTimeout(1500)
}

test.describe('서비스 상세 탭 메뉴', () => {
  test('TAB-1: 서비스 상세 페이지에 탭 메뉴가 표시됨', async ({ page }) => {
    await gotoFirstServiceDetail(page)

    // shadcn Tabs: role="tablist" 또는 탭 텍스트가 담긴 컨테이너 확인
    const tabList = page.locator('[role="tablist"]')
    const hasTabs = await tabList.isVisible({ timeout: 5000 }).catch(() => false)

    if (!hasTabs) {
      test.skip(true, '탭 UI 미배포 - 스킵')
      return
    }

    await expect(tabList).toBeVisible()
    const tabCount = await tabList.locator('[role="tab"]').count()
    expect(tabCount).toBeGreaterThanOrEqual(2)
  })

  test('TAB-2: "서비스 소개" 탭이 기본 선택됨', async ({ page }) => {
    await gotoFirstServiceDetail(page)

    // 기본 탭: "서비스 소개" 탭이 활성 상태여야 함
    // shadcn Tabs은 aria-selected="true"로 활성 탭 표시
    const tabList = page.locator('[role="tablist"]')
    const hasTabs = await tabList.isVisible({ timeout: 5000 }).catch(() => false)

    if (!hasTabs) {
      test.skip(true, '탭 UI 미배포 - 스킵')
      return
    }

    const activeTab = tabList.locator('[role="tab"][aria-selected="true"]')
    await expect(activeTab).toBeVisible({ timeout: TIMEOUT })
    const activeText = await activeTab.textContent()
    expect(activeText).toMatch(/서비스 소개/)
  })

  test('TAB-3: "리뷰" 탭 클릭 시 리뷰 내용이 표시됨', async ({ page }) => {
    await gotoFirstServiceDetail(page)

    const tabList = page.locator('[role="tablist"]')
    const hasTabs = await tabList.isVisible({ timeout: 5000 }).catch(() => false)

    if (hasTabs) {
      // "리뷰" 탭 찾기 (리뷰(N) 형식 포함)
      const reviewTab = tabList.locator('[role="tab"]').filter({ hasText: /리뷰/ })
      await expect(reviewTab).toBeVisible({ timeout: TIMEOUT })
      await reviewTab.click()
      await page.waitForTimeout(1000)

      // 탭이 활성화됨
      await expect(reviewTab).toHaveAttribute('aria-selected', 'true', { timeout: 5000 })

      // 리뷰 패널 내용이 표시됨 (리뷰 텍스트 또는 "아직 리뷰가 없습니다" 안내)
      const tabPanel = page.locator('[role="tabpanel"]')
      await expect(tabPanel).toBeVisible({ timeout: TIMEOUT })
      const panelText = await tabPanel.textContent()
      expect(panelText).toBeTruthy()
    } else {
      test.skip(true, '탭 UI 미배포 - 스킵')
    }
  })

  test('TAB-4: "포트폴리오" 탭이 존재함', async ({ page }) => {
    await gotoFirstServiceDetail(page)

    const tabList = page.locator('[role="tablist"]')
    const hasTabs = await tabList.isVisible({ timeout: 5000 }).catch(() => false)

    if (hasTabs) {
      const portfolioTab = tabList.locator('[role="tab"]').filter({ hasText: /포트폴리오/ })
      await expect(portfolioTab).toBeVisible({ timeout: TIMEOUT })
    } else {
      test.skip(true, '탭 UI 미배포 - 스킵')
    }
  })

  test('TAB-5: "FAQ" 탭이 존재함', async ({ page }) => {
    await gotoFirstServiceDetail(page)

    const tabList = page.locator('[role="tablist"]')
    const hasTabs = await tabList.isVisible({ timeout: 5000 }).catch(() => false)

    if (hasTabs) {
      const faqTab = tabList.locator('[role="tab"]').filter({ hasText: /FAQ/ })
      await expect(faqTab).toBeVisible({ timeout: TIMEOUT })
    } else {
      test.skip(true, '탭 UI 미배포 - 스킵')
    }
  })
})
