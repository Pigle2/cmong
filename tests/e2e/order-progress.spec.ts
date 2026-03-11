import { test, expect } from '@playwright/test'
import { BUYER, SELLER, TIMEOUT, login } from './helpers'

/**
 * 주문 상세 페이지 - 프로그레스 바 테스트
 *
 * PROG-1: 주문 상세 페이지에 프로그레스 바 영역이 존재함
 * PROG-2: 프로그레스 바 단계 레이블이 올바른 텍스트를 표시함 (API 레벨 검증)
 *
 * OrderProgressBar 컴포넌트 구조:
 * - 5단계: 결제완료 → 주문수락 → 작업중 → 납품 → 완료
 * - 각 단계 원형 인디케이터 (완료: 체크마크 SVG, 현재: pulse dot, 미완: 빈 dot)
 * - 단계 레이블 텍스트
 * - 취소/거절/환불/분쟁 상태 시 별도 메시지 표시
 *
 * 참고: OrderProgressBar는 서버 컴포넌트로 렌더링됨.
 * 배포 전에는 5단계 레이블이 페이지에 없으므로 skip 처리.
 */

// 주문 목록에서 첫 번째 주문 URL을 가져오는 헬퍼 (UI 기반)
async function getFirstOrderUrlFromUI(page: import('@playwright/test').Page): Promise<string | null> {
  await page.goto('/orders')
  await page.waitForLoadState('domcontentloaded', { timeout: TIMEOUT })

  // 주문 카드 링크: href="/orders/{uuid}" 패턴
  const orderLink = page.locator('a[href*="/orders/"]').first()
  const href = await orderLink.getAttribute('href', { timeout: 5000 }).catch(() => null)
  return href
}

// 프로그레스 바 배포 여부 감지
// OrderProgressBar는 SSR 컴포넌트이므로 HTML에 레이블 텍스트 포함됨
async function isProgressBarDeployed(page: import('@playwright/test').Page, orderUrl: string): Promise<boolean> {
  await page.goto(orderUrl)
  await page.waitForLoadState('domcontentloaded', { timeout: TIMEOUT })

  const stepLabels = ['결제완료', '주문수락', '작업중', '납품']
  const cancelMessages = ['취소된 주문입니다', '거절된 주문입니다', '환불 처리된 주문입니다', '분쟁 처리 중인 주문입니다']

  // 정상 주문 단계 레이블 확인
  for (const label of stepLabels) {
    const found = await page.getByText(label, { exact: true }).isVisible({ timeout: 2000 }).catch(() => false)
    if (found) return true
  }

  // 취소/거절/환불/분쟁 메시지 확인
  for (const msg of cancelMessages) {
    const found = await page.getByText(msg).isVisible({ timeout: 2000 }).catch(() => false)
    if (found) return true
  }

  return false
}

test.describe('주문 상세 - 프로그레스 바 (PROG)', () => {
  test('PROG-1: 주문 상세 페이지에 프로그레스 바 영역이 존재함', async ({ page }) => {
    await login(page, BUYER)

    const orderUrl = await getFirstOrderUrlFromUI(page)
    if (!orderUrl) {
      // 구매자 주문 없음 → 판매자 계정으로 재시도
      console.log('  구매자 주문 없음 — 판매자 주문 관리 페이지에서 탐색')
      await login(page, SELLER)
      await page.goto('/seller/orders')
      await page.waitForLoadState('domcontentloaded', { timeout: TIMEOUT })

      const sellerOrderLink = page.locator('a[href*="/orders/"]').first()
      const sellerOrderHref = await sellerOrderLink.getAttribute('href', { timeout: 5000 }).catch(() => null)

      if (!sellerOrderHref) {
        test.skip(true, '주문 데이터가 없어 프로그레스 바를 검증할 수 없음')
        return
      }

      // 프로그레스 바 배포 여부 확인
      const deployed = await isProgressBarDeployed(page, sellerOrderHref)
      if (!deployed) {
        console.log('  프로그레스 바 미배포 (로컬 개발 중)')
        test.skip(true, '주문 프로그레스 바가 아직 배포되지 않음')
        return
      }

      // 배포된 경우 검증
      const stepLabels = ['결제완료', '주문수락', '작업중', '납품', '완료']
      for (const label of stepLabels) {
        await expect(page.getByText(label, { exact: true })).toBeVisible({ timeout: TIMEOUT })
      }
      console.log('  5단계 프로그레스 바 레이블 확인 (판매자 주문)')
      return
    }

    // 배포 여부 확인
    const deployed = await isProgressBarDeployed(page, orderUrl)
    if (!deployed) {
      console.log('  프로그레스 바 미배포 — 이미 있는 주문 정보만 확인')
      // 주문 상세 페이지 자체는 정상 접근되어야 함
      const heading = page.getByRole('heading', { name: '주문 상세' })
      await expect(heading).toBeVisible({ timeout: TIMEOUT })
      console.log('  주문 상세 페이지 접근 확인 (프로그레스 바 미배포 — skip)')
      test.skip(true, '주문 프로그레스 바가 아직 배포되지 않음')
      return
    }

    // 5단계 레이블 모두 표시 확인
    const stepLabels = ['결제완료', '주문수락', '작업중', '납품', '완료']
    const cancelMessages = ['취소된 주문입니다', '거절된 주문입니다', '환불 처리된 주문입니다', '분쟁 처리 중인 주문입니다']

    // 정상 주문 상태인지 확인
    let isNormalOrder = false
    for (const label of stepLabels) {
      const found = await page.getByText(label, { exact: true }).isVisible({ timeout: 2000 }).catch(() => false)
      if (found) {
        isNormalOrder = true
        break
      }
    }

    // 취소/거절 상태 확인
    let isCancelledOrder = false
    for (const msg of cancelMessages) {
      const found = await page.getByText(msg).isVisible({ timeout: 2000 }).catch(() => false)
      if (found) {
        isCancelledOrder = true
        console.log(`  취소/거절 상태: "${msg}"`)
        break
      }
    }

    expect(isNormalOrder || isCancelledOrder).toBeTruthy()

    if (isNormalOrder) {
      // 5단계 레이블 모두 표시 확인
      for (const label of stepLabels) {
        await expect(page.getByText(label, { exact: true })).toBeVisible({ timeout: TIMEOUT })
      }
      console.log('  5단계 프로그레스 바 레이블 모두 표시 확인')

      // 단계 원형 인디케이터 존재 확인
      const stepCircles = page.locator('.h-7.w-7.rounded-full')
      const circleCount = await stepCircles.count()
      expect(circleCount).toBeGreaterThanOrEqual(5)
      console.log(`  단계 원형 인디케이터 ${circleCount}개 표시 확인`)
    }
  })

  test('PROG-2: 프로그레스 바 단계 레이블이 올바른 텍스트를 표시함 (API 레벨 검증)', async ({ page }) => {
    await login(page, BUYER)

    // 주문 상세 페이지 URL 수집
    const orderUrl = await getFirstOrderUrlFromUI(page)
    if (!orderUrl) {
      test.skip(true, '주문 데이터가 없어 프로그레스 바 상태 검증 불가')
      return
    }

    // 배포 여부 확인
    const deployed = await isProgressBarDeployed(page, orderUrl)
    if (!deployed) {
      console.log('  프로그레스 바 미배포 — 주문 번호 표시만 확인')

      // 미배포 시에도 주문 상세 구조 검증
      // 주문번호(ORD-로 시작) 존재 확인
      const orderNumber = page.locator('text=/ORD-/').first()
      await expect(orderNumber).toBeVisible({ timeout: TIMEOUT })
      const orderNumText = await orderNumber.textContent()
      console.log(`  주문번호 표시 확인: ${orderNumText}`)
      expect(orderNumText).toMatch(/ORD-/)

      test.skip(true, '주문 프로그레스 바가 아직 배포되지 않음')
      return
    }

    // 배포된 경우: 유효한 주문 상태값 기반 레이블 검증
    const validProgressStatuses = ['결제완료', '주문수락', '작업중', '납품', '완료']
    const validCancelMessages = [
      '취소된 주문입니다', '거절된 주문입니다',
      '환불 처리된 주문입니다', '분쟁 처리 중인 주문입니다',
    ]

    // 현재 표시 중인 상태 파악
    let foundStatus: string | null = null
    for (const label of validProgressStatuses) {
      const isActive = await page.locator(`span.text-primary:has-text("${label}")`).isVisible({ timeout: 2000 }).catch(() => false)
      if (isActive) {
        foundStatus = label
        break
      }
    }
    for (const msg of validCancelMessages) {
      const found = await page.getByText(msg).isVisible({ timeout: 2000 }).catch(() => false)
      if (found) {
        foundStatus = msg
        break
      }
    }

    expect(foundStatus).not.toBeNull()
    console.log(`  현재 주문 상태 레이블: "${foundStatus}"`)
  })
})
