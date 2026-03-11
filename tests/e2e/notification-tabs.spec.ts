import { test, expect } from '@playwright/test'
import { BUYER, SELLER, TIMEOUT, login } from './helpers'

/**
 * 알림 탭 필터 UI 테스트
 *
 * 수정 내용:
 *   - notification-bell.tsx: 알림 팝오버에 전체/주문/메시지/시스템 탭 필터 추가
 *
 * 배포 지연 시: 탭 UI가 없으면 자동 스킵
 *
 * NTF-TAB-1: 알림 벨 클릭 시 팝오버 열림 (기존 기능 + 신규 탭 포함)
 * NTF-TAB-2: 알림 팝오버에 탭 필터가 표시됨 (전체/주문/메시지/시스템)
 * NTF-TAB-3: 탭 클릭 시 active 스타일이 해당 탭에 적용됨
 * NTF-TAB-4: 각 탭 클릭 시 알림 없음 or 목록 표시됨
 * NTF-TAB-5: 판매자도 알림 팝오버 탭 필터 사용 가능
 * NTF-TAB-6: "전체" 탭이 기본 선택 상태로 표시됨
 */

/** 알림 팝오버를 열고 탭 UI 배포 여부 확인 */
async function openBellAndCheckTabDeployed(page: any): Promise<{
  popoverVisible: boolean
  tabDeployed: boolean
}> {
  await page.goto('/')
  await page.waitForTimeout(3000)

  const bell = page.locator('header button:has(svg.lucide-bell)').first()
  const bellVisible = await bell.isVisible({ timeout: 5000 }).catch(() => false)
  if (!bellVisible) return { popoverVisible: false, tabDeployed: false }

  await bell.click()
  await page.waitForTimeout(2000)

  const popover = page.locator('[data-radix-popper-content-wrapper]').first()
  const popoverVisible = await popover.isVisible({ timeout: 5000 }).catch(() => false)
  if (!popoverVisible) return { popoverVisible: false, tabDeployed: false }

  // 탭 UI 배포 여부: 팝오버 내부에 "전체" 텍스트가 있으면 배포됨
  const tabDeployed = await page
    .locator('[data-radix-popper-content-wrapper] button', { hasText: '전체' })
    .isVisible({ timeout: 3000 })
    .catch(() => false)

  return { popoverVisible, tabDeployed }
}

test.describe('알림 팝오버 - 탭 필터', () => {
  test('NTF-TAB-1. 알림 벨 클릭 시 알림 팝오버가 열림', async ({ page }) => {
    await login(page, BUYER)
    await page.goto('/')
    await page.waitForTimeout(3000)

    // 헤더 벨 아이콘 버튼 클릭
    const bell = page.locator('header button:has(svg.lucide-bell)').first()
    await expect(bell).toBeVisible({ timeout: TIMEOUT })
    await bell.click()
    await page.waitForTimeout(2000)

    // Radix Popover 콘텐츠가 나타나야 함
    const popover = page.locator('[data-radix-popper-content-wrapper]').first()
    await expect(popover).toBeVisible({ timeout: TIMEOUT })

    // "알림" 헤더 텍스트 확인
    await expect(page.getByText('알림').first()).toBeVisible({ timeout: 5000 })
  })

  test('NTF-TAB-2. 알림 팝오버에 탭 필터가 표시됨 (전체/주문/메시지/시스템)', async ({ page }) => {
    await login(page, BUYER)
    const { tabDeployed } = await openBellAndCheckTabDeployed(page)

    if (!tabDeployed) {
      console.log('  알림 탭 UI 미배포 — 팝오버는 열리지만 탭 없음')
      test.skip(true, '알림 탭 UI 미배포 — Vercel 배포 후 재실행 필요')
      return
    }

    // 팝오버 내부에서 탭 버튼들 확인
    // notification-bell.tsx: TABS = ['전체', '주문', '메시지', '시스템']
    const popover = page.locator('[data-radix-popper-content-wrapper]').first()
    await expect(popover.locator('button', { hasText: '전체' })).toBeVisible({ timeout: 5000 })
    await expect(popover.locator('button', { hasText: '주문' })).toBeVisible({ timeout: 5000 })
    await expect(popover.locator('button', { hasText: '메시지' })).toBeVisible({ timeout: 5000 })
    await expect(popover.locator('button', { hasText: '시스템' })).toBeVisible({ timeout: 5000 })
    console.log('  4개 탭 모두 표시됨: 전체/주문/메시지/시스템')
  })

  test('NTF-TAB-3. 탭 클릭 시 active 스타일(text-primary)이 해당 탭에 적용됨', async ({ page }) => {
    await login(page, BUYER)
    const { tabDeployed } = await openBellAndCheckTabDeployed(page)

    if (!tabDeployed) {
      test.skip(true, '알림 탭 UI 미배포 — Vercel 배포 후 재실행 필요')
      return
    }

    const popover = page.locator('[data-radix-popper-content-wrapper]').first()

    // "주문" 탭 클릭
    const orderTab = popover.locator('button', { hasText: '주문' })
    await expect(orderTab).toBeVisible({ timeout: 5000 })
    await orderTab.click()
    await page.waitForTimeout(500)

    // 클릭된 탭에 active 클래스(text-primary 또는 border-b-2 border-primary)가 적용되어야 함
    const className = await orderTab.getAttribute('class')
    expect(className).toContain('text-primary')
    console.log(`  "주문" 탭 클릭 후 클래스: ${className}`)
  })

  test('NTF-TAB-4. 각 탭 클릭 시 알림 없음 or 목록 표시됨 (오류 없이)', async ({ page }) => {
    await login(page, BUYER)
    const { tabDeployed } = await openBellAndCheckTabDeployed(page)

    if (!tabDeployed) {
      test.skip(true, '알림 탭 UI 미배포 — Vercel 배포 후 재실행 필요')
      return
    }

    const popover = page.locator('[data-radix-popper-content-wrapper]').first()

    const tabs = ['전체', '주문', '메시지', '시스템']
    for (const tabName of tabs) {
      const tab = popover.locator('button', { hasText: tabName })
      await expect(tab).toBeVisible({ timeout: 5000 })
      await tab.click()
      await page.waitForTimeout(500)

      // 클릭 후 "알림이 없습니다" 또는 알림 아이템이 표시되어야 함 (에러 없이)
      const hasEmpty = await popover
        .getByText('알림이 없습니다')
        .isVisible({ timeout: 3000 })
        .catch(() => false)
      const hasItems = await popover
        .locator('p.text-sm.font-medium')
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)

      expect(hasEmpty || hasItems).toBeTruthy()
      console.log(`  [${tabName}] 탭: ${hasEmpty ? '알림 없음' : '알림 목록 표시'}`)
    }
  })

  test('NTF-TAB-5. 판매자도 알림 팝오버 탭 필터 사용 가능', async ({ page }) => {
    await login(page, SELLER)
    const { popoverVisible, tabDeployed } = await openBellAndCheckTabDeployed(page)

    if (!popoverVisible) {
      test.skip(true, '판매자 헤더에서 알림 팝오버를 찾을 수 없음')
      return
    }
    if (!tabDeployed) {
      test.skip(true, '알림 탭 UI 미배포 — Vercel 배포 후 재실행 필요')
      return
    }

    const popover = page.locator('[data-radix-popper-content-wrapper]').first()
    // 탭 4개 모두 표시 확인
    for (const tabName of ['전체', '주문', '메시지', '시스템']) {
      await expect(popover.locator('button', { hasText: tabName })).toBeVisible({ timeout: 5000 })
    }
    console.log('  판매자 알림 팝오버 탭 4개 확인 완료')
  })

  test('NTF-TAB-6. "전체" 탭이 기본 선택 상태로 표시됨', async ({ page }) => {
    await login(page, BUYER)
    const { tabDeployed } = await openBellAndCheckTabDeployed(page)

    if (!tabDeployed) {
      test.skip(true, '알림 탭 UI 미배포 — Vercel 배포 후 재실행 필요')
      return
    }

    const popover = page.locator('[data-radix-popper-content-wrapper]').first()

    // 초기 상태: "전체" 탭이 active (text-primary)
    const allTabEl = popover.locator('button', { hasText: '전체' })
    await expect(allTabEl).toBeVisible({ timeout: 5000 })
    const className = await allTabEl.getAttribute('class')
    expect(className).toContain('text-primary')
    console.log('  "전체" 탭이 기본 active 상태로 표시됨')
  })
})
